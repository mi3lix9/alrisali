import { z } from "zod";

/** The Calculation Methods a Believer can choose; Ja'fari is the default. */
export const CALCULATION_METHODS = [
  "jafari",
  "sunni",
  "hanafi",
  "ibadi",
] as const;

export type CalculationMethod = (typeof CALCULATION_METHODS)[number];

export const DEFAULT_CALCULATION_METHOD: CalculationMethod = "jafari";

export const calculationMethodSchema = z.enum(CALCULATION_METHODS);
