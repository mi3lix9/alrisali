import {
  impactAsync,
  ImpactFeedbackStyle,
  notificationAsync,
  NotificationFeedbackType,
} from "expo-haptics";
import { Platform, Vibration } from "react-native";

/**
 * `tap`: every count (light). `step`: a Tasbih al-Zahra step done (heavy).
 * `done`: a round completed or an Open Tasbih's target reached (success).
 */
export type TasbihHaptic = "tap" | "step" | "done";

/**
 * Android vibrations, in ms (a pattern alternates wait and vibrate).
 * expo-haptics plays Android impacts at about 20% amplitude for 43 ms, which
 * many phones never make felt; the system vibrator at full amplitude is.
 */
const ANDROID_VIBRATIONS: Record<TasbihHaptic, number | number[]> = {
  tap: 30,
  step: 90,
  done: [0, 70, 90, 70],
};

/** Plays a counter haptic without holding the tap back. */
export const playHaptic = async (haptic: TasbihHaptic): Promise<void> => {
  if (Platform.OS === "android") {
    Vibration.vibrate(ANDROID_VIBRATIONS[haptic]);
    return;
  }
  try {
    await (haptic === "done"
      ? notificationAsync(NotificationFeedbackType.Success)
      : impactAsync(
          haptic === "step"
            ? ImpactFeedbackStyle.Heavy
            : ImpactFeedbackStyle.Light
        ));
  } catch {
    // A device without haptics still counts.
  }
};
