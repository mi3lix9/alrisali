import { captureException } from "@sentry/react-native";
import { useCallback, useEffect, useRef, useState } from "react";
import { AppState } from "react-native";

import { events } from "@/shared/lib/events";

/** Taps are saved together once counting pauses this long. */
const SAVE_DELAY_MS = 600;

/** Runs `write` after the previous write, so an older count never lands last. */
const writeAfter = async (
  previous: Promise<void>,
  write: () => Promise<unknown>
): Promise<void> => {
  await previous;
  try {
    await write();
  } catch (error) {
    captureException(error);
  }
};

export interface SavedCounter<T> {
  /** What the counter shows; null only while the saved value is first read. */
  value: T | null;
  /** The latest value, for the next tap; never waits for a render. */
  current: () => T;
  /** Shows `next` at once and saves it once counting pauses. */
  count: (next: T) => void;
  /**
   * Shows `next` at once, drops the save still waiting, and runs `write`
   * after every earlier save (e.g. recording a Dhikr Session that also
   * resets the stored count).
   */
  commit: (next: T, write: () => Promise<unknown>) => void;
}

/**
 * Keeps a Tasbih counter instant while it is saved behind the taps. Until the
 * first tap it shows `saved` (and follows pulls); from then on the taps on
 * this screen lead. Leaving the screen or the app saves at once; sign-out
 * drops unsaved taps and shows the fresh database.
 */
export const useSavedCounter = <T>({
  saved,
  fallback,
  save,
  onDiscard,
}: {
  /** The saved value; undefined while it is read. */
  saved: T | undefined;
  /** Shown when the saved value cannot be read, so counting still works. */
  fallback: T | null;
  save: (value: T) => Promise<void>;
  onDiscard?: () => void;
}): SavedCounter<T> => {
  const [counted, setCounted] = useState<T | null>(null);
  const baseline = saved ?? fallback;
  const value = counted ?? baseline;

  // Taps read and write refs, so a burst of taps never waits for a render.
  const baselineRef = useRef(baseline);
  const countedRef = useRef<T | null>(null);
  const unsavedRef = useRef<T | null>(null);
  const cancelSaveRef = useRef<() => void>(() => null);
  const writingRef = useRef<Promise<void>>(Promise.resolve());
  const saveRef = useRef(save);
  const onDiscardRef = useRef(onDiscard);

  useEffect(() => {
    baselineRef.current = baseline;
    saveRef.current = save;
    onDiscardRef.current = onDiscard;
  }, [baseline, save, onDiscard]);

  const flush = useCallback(() => {
    cancelSaveRef.current();
    const unsaved = unsavedRef.current;
    if (unsaved === null) {
      return;
    }
    unsavedRef.current = null;
    const write = saveRef.current;
    writingRef.current = writeAfter(writingRef.current, () => write(unsaved));
  }, []);

  const show = useCallback((next: T) => {
    countedRef.current = next;
    setCounted(next);
  }, []);

  const count = useCallback(
    (next: T) => {
      show(next);
      unsavedRef.current = next;
      cancelSaveRef.current();
      const timer = setTimeout(flush, SAVE_DELAY_MS);
      cancelSaveRef.current = () => clearTimeout(timer);
    },
    [flush, show]
  );

  const commit = useCallback(
    (next: T, write: () => Promise<unknown>) => {
      show(next);
      cancelSaveRef.current();
      unsavedRef.current = null;
      writingRef.current = writeAfter(writingRef.current, write);
    },
    [show]
  );

  const current = useCallback((): T => {
    const latest = countedRef.current ?? baselineRef.current;
    if (latest === null) {
      throw new Error("The Tasbih counter was tapped before it loaded");
    }
    return latest;
  }, []);

  useEffect(() => {
    const subscription = AppState.addEventListener("change", (state) => {
      if (state !== "active") {
        flush();
      }
    });
    const unsubscribe = events.on("SignedOut", () => {
      cancelSaveRef.current();
      unsavedRef.current = null;
      countedRef.current = null;
      setCounted(null);
      onDiscardRef.current?.();
    });
    return () => {
      subscription.remove();
      unsubscribe();
      flush();
    };
  }, [flush]);

  return { value, current, count, commit };
};
