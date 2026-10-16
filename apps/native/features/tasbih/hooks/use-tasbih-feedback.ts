import {
  DEFAULT_TASBIH_SETTINGS,
  tasbihFeedback,
} from "@alrisali/domain/tasbih";
import type { TasbihFeedbackMode } from "@alrisali/domain/tasbih";
import { useCallback, useEffect } from "react";

import { useTasbihSettings } from "../data/tasbih-settings";
import { playHaptic } from "../utils/haptics";
import type { TasbihHaptic } from "../utils/haptics";
import { playTasbihSound, preloadTasbihSounds } from "../utils/sounds";

/** The feedback mode a tap follows now. */
const useFeedbackMode = (): TasbihFeedbackMode => {
  const settings = useTasbihSettings();
  if (settings.data) {
    return settings.data.feedbackMode;
  }
  // Until the choice is read, stay quiet: it may be silent. A failed read
  // falls back to the default.
  return settings.isError ? DEFAULT_TASBIH_SETTINGS.feedbackMode : "silent";
};

/**
 * Plays a counter cue (`tap`, `step` or `done`) the way the Believer chose:
 * sound and haptic, haptic only, or nothing. Fire and forget, so a tap never
 * waits on it.
 */
export const useTasbihFeedback = (): ((cue: TasbihHaptic) => void) => {
  const mode = useFeedbackMode();
  const { sound, haptic } = tasbihFeedback(mode);

  useEffect(() => {
    if (sound) {
      preloadTasbihSounds();
    }
  }, [sound]);

  return useCallback(
    (cue: TasbihHaptic) => {
      if (haptic) {
        void playHaptic(cue);
      }
      if (sound) {
        playTasbihSound(cue);
      }
    },
    [haptic, sound]
  );
};
