import { captureException } from "@sentry/react-native";
import { useCallback, useEffect, useRef } from "react";
import { AppState } from "react-native";

import { savePosition } from "../data/positions";

/** Positions change many times a second while playing or scrolling. */
const SAVE_DELAY_MS = 2000;

/**
 * Saves where the Believer is in a Library Asset: the latest reported position
 * a moment after it was reported, and at once when the app goes to the
 * background or the viewer closes. Returns the function viewers report to.
 */
export const usePositionSaver = (assetId: string) => {
  const unsavedRef = useRef<number | null>(null);
  const cancelSaveRef = useRef<(() => void) | null>(null);

  const flush = useCallback(() => {
    cancelSaveRef.current?.();
    cancelSaveRef.current = null;
    const unsaved = unsavedRef.current;
    if (unsaved === null) {
      return;
    }
    unsavedRef.current = null;
    const write = async () => {
      try {
        await savePosition(assetId, unsaved);
      } catch (error) {
        captureException(error);
      }
    };
    void write();
  }, [assetId]);

  const report = useCallback(
    (position: number) => {
      unsavedRef.current = position;
      if (cancelSaveRef.current === null) {
        const timer = setTimeout(flush, SAVE_DELAY_MS);
        cancelSaveRef.current = () => clearTimeout(timer);
      }
    },
    [flush]
  );

  useEffect(() => {
    const subscription = AppState.addEventListener("change", (state) => {
      if (state !== "active") {
        flush();
      }
    });
    return () => {
      subscription.remove();
      flush();
    };
  }, [flush]);

  return report;
};
