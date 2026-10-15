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
import {
  impactAsync,
  ImpactFeedbackStyle,
  notificationAsync,
  NotificationFeedbackType,
} from "expo-haptics";
import { useCallback, useEffect, useRef, useState } from "react";
import { AppState } from "react-native";

import { events } from "@/shared/lib/events";

import {
  recordDhikrSession,
  saveTasbihAlZahraProgress,
  useSavedTasbihAlZahraProgress,
} from "../data/tasbih";

/** Taps are saved together once counting pauses this long. */
const SAVE_DELAY_MS = 600;

const playFeedback = async (feedback: TasbihAlZahraFeedback): Promise<void> => {
  try {
    await (feedback === "round"
      ? notificationAsync(NotificationFeedbackType.Success)
      : impactAsync(
          feedback === "step"
            ? ImpactFeedbackStyle.Heavy
            : ImpactFeedbackStyle.Light
        ));
  } catch {
    // A device without haptics still counts.
  }
};

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

/** Saves after the previous save, so an older count never lands last. */
const saveAfter = async (
  previous: Promise<void>,
  progress: TasbihAlZahraProgress
): Promise<void> => {
  await previous;
  try {
    await saveTasbihAlZahraProgress(progress);
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
 * and never hold a tap back. Until the first tap the counter shows the saved
 * progress (and follows pulls); from then on the taps on this screen lead.
 */
export const useTasbihAlZahra = (): TasbihAlZahraCounter => {
  const saved = useSavedTasbihAlZahraProgress();
  const [counted, setCounted] = useState<TasbihAlZahraProgress | null>(null);
  const [lastFeedback, setLastFeedback] =
    useState<TasbihAlZahraFeedback | null>(null);

  // A failed read still lets the Believer count, from the start.
  const baseline = saved.data ?? (saved.isError ? TASBIH_AL_ZAHRA_START : null);
  const progress = counted ?? baseline;

  // Taps read and write refs, so a burst of taps never waits for a render.
  const baselineRef = useRef(baseline);
  const countedRef = useRef<TasbihAlZahraProgress | null>(null);
  const unsavedRef = useRef<TasbihAlZahraProgress | null>(null);
  const cancelSaveRef = useRef<() => void>(() => null);
  const savingRef = useRef<Promise<void>>(Promise.resolve());

  useEffect(() => {
    baselineRef.current = baseline;
  }, [baseline]);

  const flush = useCallback(() => {
    cancelSaveRef.current();
    const unsaved = unsavedRef.current;
    if (!unsaved) {
      return;
    }
    unsavedRef.current = null;
    savingRef.current = saveAfter(savingRef.current, unsaved);
  }, []);

  const show = useCallback(
    (next: TasbihAlZahraProgress) => {
      countedRef.current = next;
      setCounted(next);
      unsavedRef.current = next;
      cancelSaveRef.current();
      const timer = setTimeout(flush, SAVE_DELAY_MS);
      cancelSaveRef.current = () => clearTimeout(timer);
    },
    [flush]
  );

  const tap = useCallback(() => {
    const outcome = tapTasbihAlZahra(
      countedRef.current ?? baselineRef.current ?? TASBIH_AL_ZAHRA_START
    );
    playFeedback(outcome.feedback);
    show(outcome.progress);
    setLastFeedback(outcome.feedback);
    if (outcome.dhikrSessionCount !== null) {
      completeRound(outcome.dhikrSessionCount);
    }
  }, [show]);

  const reset = useCallback(() => {
    show(TASBIH_AL_ZAHRA_START);
    setLastFeedback(null);
  }, [show]);

  useEffect(() => {
    // Leaving the screen or the app saves at once.
    const subscription = AppState.addEventListener("change", (state) => {
      if (state !== "active") {
        flush();
      }
    });
    // Sign-out wipes the database; show the fresh one, and drop unsaved taps.
    const unsubscribe = events.on("SignedOut", () => {
      cancelSaveRef.current();
      unsavedRef.current = null;
      countedRef.current = null;
      setCounted(null);
      setLastFeedback(null);
    });
    return () => {
      subscription.remove();
      unsubscribe();
      flush();
    };
  }, [flush]);

  return { progress, roundCompleted: lastFeedback === "round", tap, reset };
};
