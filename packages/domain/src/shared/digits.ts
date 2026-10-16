import { z } from "zod";

/**
 * The digits numbers are written in: Arabic-Indic (٠–٩) or Western (0–9).
 * The Believer picks them for the Arabic interface; English is always
 * written in Western digits.
 */
export const DIGITS = ["arabic-indic", "latin"] as const;

export type Digits = (typeof DIGITS)[number];

export const DEFAULT_DIGITS: Digits = "arabic-indic";

export const digitsSchema = z.enum(DIGITS);
