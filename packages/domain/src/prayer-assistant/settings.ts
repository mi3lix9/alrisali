import { z } from "zod";

import { customPaceSchema, PACE_PRESETS, paceSchema } from "./pace";
import type { CustomPace, Pace, PaceChoice } from "./pace";

/**
 * How easily a sensed bow counts as Ruku: 0 needs a deep bow, 100 takes a
 * shallow one. Tolerant by default, as in the old app.
 */
export const BOW_SENSITIVITY_LIMITS = { min: 0, max: 100 } as const;

export const DEFAULT_BOW_SENSITIVITY = 70;

export const bowSensitivitySchema = z
  .number()
  .int()
  .min(BOW_SENSITIVITY_LIMITS.min)
  .max(BOW_SENSITIVITY_LIMITS.max);

/**
 * How the Prayer Assistant senses the Believer's Position. Tap needs no
 * sensor; Camera and Head Height read the camera, Sound hears each Takbir and
 * Mat watches the camera covered in sujud and Proximity feels the
 * forehead cover the proximity sensor.
 */
export const RECOGNITION_MODES = [
  "tap",
  "camera",
  "head-height",
  "sound",
  "mat",
  "proximity",
] as const;

export type RecognitionMode = (typeof RECOGNITION_MODES)[number];

export const DEFAULT_RECOGNITION_MODE: RecognitionMode = "tap";

export const recognitionModeSchema = z.enum(RECOGNITION_MODES);

/** The Believer's Prayer Assistant choices, kept between Salahs. */
export interface PrayerAssistantSettings {
  pace: Pace;
  /** The holds a Custom Pace uses; kept when another Pace is chosen. */
  custom: CustomPace;
  bowSensitivity: number;
  recognitionMode: RecognitionMode;
}

export const DEFAULT_PRAYER_ASSISTANT_SETTINGS: PrayerAssistantSettings = {
  pace: "normal",
  custom: PACE_PRESETS.normal,
  bowSensitivity: DEFAULT_BOW_SENSITIVITY,
  recognitionMode: DEFAULT_RECOGNITION_MODE,
};

export const prayerAssistantSettingsSchema = z.object({
  pace: paceSchema,
  custom: customPaceSchema,
  bowSensitivity: bowSensitivitySchema,
  recognitionMode: recognitionModeSchema,
});

/** The Pace the rak'ah machine runs at, from the saved settings. */
export const paceChoice = ({
  pace,
  custom,
}: PrayerAssistantSettings): PaceChoice =>
  pace === "custom" ? { pace, custom } : { pace };
