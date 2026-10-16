import { z } from "zod";

/** The Calculation Methods a Believer can choose; Ja'fari is the default. */
export const CALCULATION_METHODS = [
  "jafari",
  "sunni",
  "hanafi",
  "ibadi",
  "leva",
  "tehran",
  "ithnaAshari",
  "alHadiBahrain",
  "mwl",
  "isna",
  "egypt",
  "karachi",
  "ummAlQura",
  "custom",
] as const;

export type CalculationMethod = (typeof CALCULATION_METHODS)[number];

export const DEFAULT_CALCULATION_METHOD: CalculationMethod = "jafari";

export const calculationMethodSchema = z.enum(CALCULATION_METHODS);

/**
 * How the settings list the Calculation Methods: Shia, Sunni, then the rest.
 * Every method is in exactly one group, in the order it is shown.
 */
export const CALCULATION_METHOD_GROUPS = [
  {
    group: "shia",
    methods: ["jafari", "leva", "tehran", "ithnaAshari", "alHadiBahrain"],
  },
  {
    group: "sunni",
    methods: [
      "sunni",
      "hanafi",
      "mwl",
      "isna",
      "egypt",
      "karachi",
      "ummAlQura",
    ],
  },
  { group: "other", methods: ["ibadi", "custom"] },
] as const satisfies readonly {
  group: string;
  methods: readonly CalculationMethod[];
}[];

/** The sun's depression, in degrees below the horizon, for Custom. */
export const CUSTOM_ANGLE_RANGES = {
  fajr: { min: 10, max: 25 },
  /** 0 puts Maghrib at Sunset. */
  maghrib: { min: 0, max: 10 },
  isha: { min: 10, max: 25 },
} as const;

const angleSchema = (range: { min: number; max: number }) =>
  z.number().min(range.min).max(range.max);

/** The angles of the Custom Calculation Method. */
export const customAnglesSchema = z.object({
  fajr: angleSchema(CUSTOM_ANGLE_RANGES.fajr),
  maghrib: angleSchema(CUSTOM_ANGLE_RANGES.maghrib),
  isha: angleSchema(CUSTOM_ANGLE_RANGES.isha),
});

export type CustomAngles = z.infer<typeof customAnglesSchema>;

/** What Custom starts from: the angles of the Al-Hadi calendar. */
export const DEFAULT_CUSTOM_ANGLES: CustomAngles = {
  fajr: 18,
  maghrib: 4,
  isha: 14,
};
