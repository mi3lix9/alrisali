import { MAX_BATCH_EVENTS } from "@alrisali/domain/analytics";
import type { AnalyticsEvent } from "@alrisali/domain/analytics";

// The device's outbox of usage events. Events are kept on disk until the
// server has them, sent in batches, and resent after a failure (offline, a
// server error) with a growing pause, so nothing is lost while the device is
// offline and nothing is sent twice once it is stored (the server skips
// event ids it already has).

/** Where the outbox lives between launches. */
export interface AnalyticsQueueStore {
  load: () => Promise<AnalyticsEvent[]>;
  save: (events: readonly AnalyticsEvent[]) => Promise<void>;
}

export interface AnalyticsQueueOptions {
  store: AnalyticsQueueStore;
  /** Sends one batch; rejects when the server did not store it. */
  send: (events: AnalyticsEvent[]) => Promise<void>;
  /**
   * Whether a failure means the server will never accept the batch (it is
   * malformed), rather than "try again later".
   */
  isRefusal: (error: unknown) => boolean;
  now: () => number;
  newId: () => string;
  /** Sends as soon as this many events wait. */
  flushAt?: number;
  /** The oldest events are dropped beyond this many. */
  maxQueued?: number;
}

export type TrackedEvent = Omit<AnalyticsEvent, "id" | "occurredAt">;

export interface AnalyticsQueue {
  track: (event: TrackedEvent) => Promise<void>;
  /**
   * Sends every waiting event, batch by batch, unless a recent failure asks
   * to wait (`force` ignores the pause). Stops at the first failure.
   */
  flush: (options?: { force?: boolean }) => Promise<void>;
  /** How many events wait to be sent. */
  size: () => Promise<number>;
}

const FLUSH_AT = 20;
const MAX_QUEUED = 1000;
const FIRST_RETRY_MS = 30 * 1000;
const MAX_RETRY_MS = 60 * 60 * 1000;

export const createAnalyticsQueue = ({
  store,
  send,
  isRefusal,
  now,
  newId,
  flushAt = FLUSH_AT,
  maxQueued = MAX_QUEUED,
}: AnalyticsQueueOptions): AnalyticsQueue => {
  let queued: AnalyticsEvent[] | null = null;
  let failures = 0;
  let retryAt = 0;
  // Every read-modify-write of the outbox runs after the previous one.
  let tail: Promise<unknown> = Promise.resolve();

  const serially = <Result>(work: () => Promise<Result>): Promise<Result> => {
    const previous = tail;
    const run = (async () => {
      try {
        await previous;
      } catch {
        // The previous change failed; this one still runs.
      }
      return work();
    })();
    tail = run;
    return run;
  };

  const events = async (): Promise<AnalyticsEvent[]> => {
    if (queued === null) {
      try {
        queued = await store.load();
      } catch {
        // An unreadable outbox starts over.
        queued = [];
      }
    }
    return queued;
  };

  const replace = async (next: AnalyticsEvent[]) => {
    queued = next;
    await store.save(next);
  };

  const sendAll = async (force: boolean) => {
    if (!force && now() < retryAt) {
      return;
    }
    let waiting = await events();
    while (waiting.length > 0) {
      const batch = waiting.slice(0, MAX_BATCH_EVENTS);
      try {
        // oxlint-disable-next-line no-await-in-loop -- one batch at a time, in order
        await send(batch);
      } catch (error) {
        if (!isRefusal(error)) {
          failures += 1;
          retryAt =
            now() +
            Math.min(FIRST_RETRY_MS * 2 ** (failures - 1), MAX_RETRY_MS);
          return;
        }
        // The server will never take this batch: resending would block every
        // later event behind it, so it goes.
      }
      failures = 0;
      retryAt = 0;
      // Tracking waits for the send (one outbox change at a time), so the
      // batch is still at the front.
      waiting = waiting.slice(batch.length);
      // oxlint-disable-next-line no-await-in-loop -- the outbox is saved after each batch
      await replace(waiting);
    }
  };

  const flush: AnalyticsQueue["flush"] = ({ force = false } = {}) =>
    serially(() => sendAll(force));

  const track: AnalyticsQueue["track"] = async (event) => {
    const length = await serially(async () => {
      const next = [
        ...(await events()),
        { ...event, id: newId(), occurredAt: now() },
      ].slice(-maxQueued);
      await replace(next);
      return next.length;
    });
    if (length >= flushAt) {
      await flush();
    }
  };

  return {
    track,
    flush,
    size: () =>
      serially(async () => {
        const waiting = await events();
        return waiting.length;
      }),
  };
};
