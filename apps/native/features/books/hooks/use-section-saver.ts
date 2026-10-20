import { captureException } from "@sentry/react-native";
import { useCallback, useEffect, useRef } from "react";
import { AppState } from "react-native";

import { saveSupplicationSection } from "../data/supplication-positions";

/** The section changes many times while the Believer scrolls. */
const SAVE_DELAY_MS = 2000;

/**
 * Saves the section the Believer reached in a Supplication: the latest
 * reported one a moment after it was reported, and at once when the app goes
 * to the background or the reader closes. Returns the function to report to.
 */
export const useSectionSaver = (supplicationId: string) => {
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
        await saveSupplicationSection(supplicationId, unsaved);
      } catch (error) {
        captureException(error);
      }
    };
    void write();
  }, [supplicationId]);

  const report = useCallback(
    (section: number) => {
      unsavedRef.current = section;
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
