import type { AnalyticsEvent } from "@alrisali/domain/analytics";
import { describe, expect, it } from "vitest";

import { createAnalyticsQueue } from "./analytics-queue";
import type { AnalyticsQueueOptions } from "./analytics-queue";

class RefusedError extends Error {
  override name = "RefusedError";
}

/** A device: its outbox on "disk", a server that may be offline, a clock. */
const device = (overrides: Partial<AnalyticsQueueOptions> = {}) => {
  const disk: { events: readonly AnalyticsEvent[] } = { events: [] };
  const server = {
    online: true,
    refuse: false,
    batches: [] as AnalyticsEvent[][],
  };
  const clock = { now: 1_000_000 };
  let ids = 0;

  const options: AnalyticsQueueOptions = {
    store: {
      load: () => Promise.resolve([...disk.events]),
      save: (events) => {
        disk.events = [...events];
        return Promise.resolve();
      },
    },
    send: (events) => {
      if (server.refuse) {
        return Promise.reject(new RefusedError("BAD_REQUEST"));
      }
      if (!server.online) {
        return Promise.reject(new Error("Network request failed"));
      }
      server.batches.push(events);
      return Promise.resolve();
    },
    isRefusal: (error) => error instanceof RefusedError,
    now: () => clock.now,
    newId: () => {
      ids += 1;
      return `id-${ids}`;
    },
    flushAt: 1000,
    ...overrides,
  };
  const launch = () => createAnalyticsQueue(options);
  return { disk, server, clock, launch };
};

const screen = (name: string) => ({ type: "screen_view" as const, name });

const namesIn = (batches: AnalyticsEvent[][]) =>
  batches.map((batch) => batch.map(({ name }) => name));

describe(createAnalyticsQueue, () => {
  it("keeps events until a flush sends them as one batch", async () => {
    const { server, launch } = device();
    const queue = launch();

    await queue.track(screen("home"));
    await queue.track(screen("quran"));

    expect(server.batches).toStrictEqual([]);
    await queue.flush();
    expect(namesIn(server.batches)).toStrictEqual([["home", "quran"]]);
    await expect(queue.size()).resolves.toBe(0);
  });

  it("stamps each event with a fresh id and the time it was tracked", async () => {
    const { server, clock, launch } = device();
    const queue = launch();

    await queue.track({ ...screen("home"), data: { from: "tab" } });
    clock.now += 5000;
    await queue.track(screen("quran"));
    await queue.flush();

    expect(server.batches[0]).toStrictEqual([
      {
        type: "screen_view",
        name: "home",
        data: { from: "tab" },
        id: "id-1",
        occurredAt: 1_000_000,
      },
      { type: "screen_view", name: "quran", id: "id-2", occurredAt: 1_005_000 },
    ]);
  });

  it("sends by itself once enough events wait", async () => {
    const { server, launch } = device({ flushAt: 3 });
    const queue = launch();

    await queue.track(screen("a"));
    await queue.track(screen("b"));
    expect(server.batches).toHaveLength(0);
    await queue.track(screen("c"));

    expect(namesIn(server.batches)).toStrictEqual([["a", "b", "c"]]);
  });

  it("splits a long outbox into batches of at most 100", async () => {
    const { server, launch } = device();
    const queue = launch();
    for (let index = 0; index < 250; index += 1) {
      // oxlint-disable-next-line no-await-in-loop -- tracked in order
      await queue.track(screen(`s${index}`));
    }

    await queue.flush();

    expect(server.batches.map((batch) => batch.length)).toStrictEqual([
      100, 100, 50,
    ]);
  });

  it("keeps events on disk while offline and sends them after a relaunch", async () => {
    const { server, launch } = device();
    server.online = false;
    const first = launch();
    await first.track(screen("home"));
    await first.flush();

    const relaunched = launch();
    server.online = true;
    await relaunched.flush();

    expect(namesIn(server.batches)).toStrictEqual([["home"]]);
    await expect(relaunched.size()).resolves.toBe(0);
  });

  it("waits longer after each failure before retrying, unless forced", async () => {
    const { server, clock, launch } = device();
    const queue = launch();
    await queue.track(screen("home"));
    server.online = false;
    await queue.flush();
    server.online = true;

    // 30 s pause after the first failure.
    clock.now += 29_000;
    await queue.flush();
    expect(server.batches).toHaveLength(0);
    clock.now += 1000;
    server.online = false;
    await queue.flush();

    // 60 s after the second.
    server.online = true;
    clock.now += 59_000;
    await queue.flush();
    expect(server.batches).toHaveLength(0);
    await queue.flush({ force: true });
    expect(namesIn(server.batches)).toStrictEqual([["home"]]);
  });

  it("drops a batch the server refuses, so later events still go", async () => {
    const { server, launch } = device();
    const queue = launch();
    await queue.track(screen("malformed"));
    server.refuse = true;
    await queue.flush();
    server.refuse = false;

    await queue.track(screen("home"));
    await queue.flush();

    expect(namesIn(server.batches)).toStrictEqual([["home"]]);
  });

  it("drops the oldest events beyond its limit", async () => {
    const { server, launch } = device({ maxQueued: 2 });
    const queue = launch();
    await queue.track(screen("a"));
    await queue.track(screen("b"));
    await queue.track(screen("c"));

    await queue.flush();

    expect(namesIn(server.batches)).toStrictEqual([["b", "c"]]);
  });

  it("starts empty when the stored outbox cannot be read", async () => {
    const { server, launch } = device({
      store: {
        load: () => Promise.reject(new Error("corrupt")),
        save: () => Promise.resolve(),
      },
    });
    const queue = launch();

    await queue.track(screen("home"));
    await queue.flush();

    expect(namesIn(server.batches)).toStrictEqual([["home"]]);
  });
});
