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

/** The Believer's Prayer Assistant choices, kept between Salahs. */
export interface PrayerAssistantSettings {
  pace: Pace;
  /** The holds a Custom Pace uses; kept when another Pace is chosen. */
  custom: CustomPace;
  bowSensitivity: number;
}

export const DEFAULT_PRAYER_ASSISTANT_SETTINGS: PrayerAssistantSettings = {
  pace: "normal",
  custom: PACE_PRESETS.normal,
  bowSensitivity: DEFAULT_BOW_SENSITIVITY,
};

export const prayerAssistantSettingsSchema = z.object({
  pace: paceSchema,
  custom: customPaceSchema,
  bowSensitivity: bowSensitivitySchema,
});

/** The Pace the rak'ah machine runs at, from the saved settings. */
export const paceChoice = ({
  pace,
  custom,
}: PrayerAssistantSettings): PaceChoice =>
  pace === "custom" ? { pace, custom } : { pace };
