import {
  impactAsync,
  ImpactFeedbackStyle,
  notificationAsync,
  NotificationFeedbackType,
} from "expo-haptics";

/**
 * `tap`: every count (light). `step`: a Tasbih al-Zahra step done (heavy).
 * `done`: a round completed or an Open Tasbih's target reached (success).
 */
export type TasbihHaptic = "tap" | "step" | "done";

/** Plays a counter haptic without holding the tap back. */
export const playHaptic = async (haptic: TasbihHaptic): Promise<void> => {
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
