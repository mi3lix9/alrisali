import { activateKeepAwakeAsync, deactivateKeepAwake } from "expo-keep-awake";
import { useEffect } from "react";

const TAG = "quran-reader";

/**
 * Keeps the screen awake while the calling reader is mounted and `enabled`;
 * turning the setting off, or leaving the reader, lets the screen sleep.
 */
export const useReaderKeepAwake = (enabled: boolean) => {
  useEffect(() => {
    if (!enabled) {
      return;
    }
    void activateKeepAwakeAsync(TAG);
    return () => {
      void deactivateKeepAwake(TAG);
    };
  }, [enabled]);
};
