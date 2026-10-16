import { z } from "zod";

/**
 * What a Tasbih plays on each tap: a sound and a vibration, a vibration only,
 * or nothing (to count in the mosque without noise).
 */
export const TASBIH_FEEDBACK_MODES = [
  "sound-and-haptic",
  "haptic",
  "silent",
] as const;

export const tasbihFeedbackModeSchema = z.enum(TASBIH_FEEDBACK_MODES);

export type TasbihFeedbackMode = z.infer<typeof tasbihFeedbackModeSchema>;

/** The Believer's Tasbih choices, shared by every Tasbih. */
export const tasbihSettingsSchema = z.object({
  feedbackMode: tasbihFeedbackModeSchema,
});

export type TasbihSettings = z.infer<typeof tasbihSettingsSchema>;

export const DEFAULT_TASBIH_SETTINGS: TasbihSettings = {
  feedbackMode: "haptic",
};

/** Which outputs a tap plays in a feedback mode. */
export interface TasbihFeedbackOutputs {
  sound: boolean;
  haptic: boolean;
}

export const tasbihFeedback = (
  mode: TasbihFeedbackMode
): TasbihFeedbackOutputs => ({
  sound: mode === "sound-and-haptic",
  haptic: mode !== "silent",
});
