import type { OpenTasbih } from "@alrisali/db-user/tasbih";
import { tapOpenTasbih } from "@alrisali/domain/tasbih";
import { captureException } from "@sentry/react-native";
import { randomUUID } from "expo-crypto";
import { useCallback, useState } from "react";

import { events } from "@/shared/lib/events";

import {
  saveOpenTasbihCount,
  saveOpenTasbihSession,
  useSavedOpenTasbih,
} from "../data/tasbih";
import { useSavedCounter } from "./use-saved-counter";
import { useTasbihFeedback } from "./use-tasbih-feedback";

/**
 * What the counter last announced: the target reached, a saved session, or a
 * session that could not be saved (its count is back on the counter).
 */
export type OpenTasbihNotice =
  | "target-reached"
  | "session-saved"
  | "session-failed"
  | null;

export interface OpenTasbihCounter {
  /** Undefined while first read; null once the Open Tasbih is deleted. */
  tasbih: OpenTasbih | null | undefined;
  /** Null only while the saved count is first read. */
  count: number | null;
  notice: OpenTasbihNotice;
  tap: () => void;
  /**
   * Records the count as a Dhikr Session and starts again from 0; if the
   * save fails, the count comes back and the notice says so.
   */
  saveSession: () => void;
  /** Starts again from 0 without recording anything. */
  reset: () => void;
}

/**
 * An Open Tasbih's counter. A tap counts and plays its feedback at once; the
 * tap that reaches the target plays the success feedback and shows a notice.
 */
export const useOpenTasbih = (tasbihId: string): OpenTasbihCounter => {
  const saved = useSavedOpenTasbih(tasbihId);
  const [notice, setNotice] = useState<OpenTasbihNotice>(null);
  const discard = useCallback(() => setNotice(null), []);
  const save = useCallback(
    (count: number) => saveOpenTasbihCount(tasbihId, count),
    [tasbihId]
  );
  const counter = useSavedCounter({
    saved: saved.data?.count,
    // A failed read still lets the Believer count, from 0.
    fallback: saved.isError ? 0 : null,
    save,
    onDiscard: discard,
  });
  const { current, count, commit } = counter;
  const target = saved.data?.target ?? null;
  const feedback = useTasbihFeedback();

  const tap = useCallback(() => {
    const outcome = tapOpenTasbih({ count: current(), target });
    const reached = outcome.feedback === "target";
    feedback(reached ? "done" : "tap");
    count(outcome.count);
    // "Target reached" stays while counting on past it; a tap clears the
    // notice about the last save.
    setNotice((shown) => {
      if (reached) {
        return "target-reached";
      }
      return shown === "target-reached" ? shown : null;
    });
  }, [current, count, target, feedback]);

  const saveSession = useCallback(() => {
    const counted = current();
    if (counted === 0) {
      return;
    }
    const session = {
      id: randomUUID(),
      tasbihId,
      count: counted,
      completedAt: Date.now(),
    };
    setNotice(null);
    const record = async () => {
      try {
        await commit(0, async () => {
          const recorded = await saveOpenTasbihSession(session);
          events.emit("DhikrSessionCompleted", {
            sessionId: recorded.id,
            tasbihId: recorded.tasbihId,
            count: recorded.count,
            completedAt: recorded.completedAt,
          });
        });
        setNotice("session-saved");
      } catch (error) {
        captureException(error);
        // Taps made while saving count on top of the count that came back.
        count(counted + current());
        setNotice("session-failed");
      }
    };
    void record();
  }, [current, commit, count, tasbihId]);

  const reset = useCallback(() => {
    count(0);
    setNotice(null);
  }, [count]);

  return {
    tasbih: saved.data,
    count: counter.value,
    notice,
    tap,
    saveSession,
    reset,
  };
};
