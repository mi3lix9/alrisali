import {
  TASBIH_AL_ZAHRA_ID,
  TASBIH_AL_ZAHRA_START,
  tapTasbihAlZahra,
} from "@alrisali/domain/tasbih";
import type {
  TasbihAlZahraFeedback,
  TasbihAlZahraProgress,
} from "@alrisali/domain/tasbih";
import { captureException } from "@sentry/react-native";
import { randomUUID } from "expo-crypto";
import { useCallback, useState } from "react";

import { events } from "@/shared/lib/events";

import {
  recordDhikrSession,
  saveTasbihAlZahraProgress,
  useSavedTasbihAlZahraProgress,
} from "../data/tasbih";
import { playHaptic } from "../utils/haptics";
import { useSavedCounter } from "./use-saved-counter";
/** Records the round's Dhikr Session, then tells the other features. */
const completeRound = async (count: number): Promise<void> => {
  try {
    const session = await recordDhikrSession({
      id: randomUUID(),
      tasbihId: TASBIH_AL_ZAHRA_ID,
      count,
      completedAt: Date.now(),
    });
    events.emit("DhikrSessionCompleted", {
      sessionId: session.id,
      tasbihId: session.tasbihId,
      count: session.count,
      completedAt: session.completedAt,
    });
  } catch (error) {
    captureException(error);
  }
};

export interface TasbihAlZahraCounter {
  /** Null only while the saved progress is first read. */
  progress: TasbihAlZahraProgress | null;
  /** True right after the tap that completed a round. */
  roundCompleted: boolean;
  tap: () => void;
  reset: () => void;
}

/**
 * Tasbih al-Zahra's counter. A tap updates the count and plays its haptic at
 * once; saving, recording the Dhikr Session and sync all happen afterwards
 * and never hold a tap back.
 */
export const useTasbihAlZahra = (): TasbihAlZahraCounter => {
  const saved = useSavedTasbihAlZahraProgress();
  const [lastFeedback, setLastFeedback] =
    useState<TasbihAlZahraFeedback | null>(null);
  const discard = useCallback(() => setLastFeedback(null), []);
  const counter = useSavedCounter({
    saved: saved.data,
    // A failed read still lets the Believer count, from the start.
    fallback: saved.isError ? TASBIH_AL_ZAHRA_START : null,
    save: saveTasbihAlZahraProgress,
    onDiscard: discard,
  });
  const { current, count } = counter;

  const tap = useCallback(() => {
    const outcome = tapTasbihAlZahra(current());
    playHaptic(outcome.feedback === "round" ? "done" : outcome.feedback);
    count(outcome.progress);
    setLastFeedback(outcome.feedback);
    if (outcome.dhikrSessionCount !== null) {
      completeRound(outcome.dhikrSessionCount);
    }
  }, [current, count]);

  const reset = useCallback(() => {
    count(TASBIH_AL_ZAHRA_START);
    setLastFeedback(null);
  }, [count]);

  return {
    progress: counter.value,
    roundCompleted: lastFeedback === "round",
    tap,
    reset,
  };
};
