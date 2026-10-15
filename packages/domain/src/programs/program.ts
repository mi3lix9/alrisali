import { z } from "zod";

import {
  hijriDaySchema,
  hijriMonthSchema,
  isInHijriWindow,
} from "../shared/hijri";
import type { HijriDate, HijriWindow } from "../shared/hijri";
import { salahSchema } from "../shared/salah";

const NAME_MAX_LENGTH = 120;
const TEXT_MAX_LENGTH = 4000;
const MAX_RAKAHS = 20;

/** A required name in both languages. */
const bilingualNameSchema = z.object({
  ar: z.string().trim().min(1).max(NAME_MAX_LENGTH),
  en: z.string().trim().min(1).max(NAME_MAX_LENGTH),
});

/** Optional text in both languages; blank is "none". */
const bilingualTextSchema = z.object({
  ar: z.string().trim().max(TEXT_MAX_LENGTH),
  en: z.string().trim().max(TEXT_MAX_LENGTH),
});

export type BilingualText = z.output<typeof bilingualTextSchema>;

export const EMPTY_BILINGUAL_TEXT: BilingualText = { ar: "", en: "" };

/**
 * When an Act is due: every day, on chosen weekdays (Temporal's 1 = Monday …
 * 7 = Sunday, sorted, without repeats) or once on a calendar day. The same
 * JSON as a Habit's schedule.
 */
export const actScheduleSchema = z.discriminatedUnion("kind", [
  z.object({ kind: z.literal("daily") }),
  z.object({
    kind: z.literal("weekdays"),
    weekdays: z
      .array(z.number().int().min(1).max(7))
      .min(1)
      .transform((weekdays) =>
        [...new Set(weekdays)].toSorted((a, b) => a - b)
      ),
  }),
  z.object({ kind: z.literal("once"), date: z.iso.date() }),
]);

export type ActSchedule = z.output<typeof actScheduleSchema>;

export const SALAH_TIMINGS = ["before", "after"] as const;

export type SalahTiming = (typeof SALAH_TIMINGS)[number];

/** An Act tied to a Salah, done before or after it; null for a general Act. */
export const actSalahSchema = z
  .object({ salah: salahSchema, timing: z.enum(SALAH_TIMINGS) })
  .nullable();

export type ActSalah = z.output<typeof actSalahSchema>;

export const ACT_TYPES = ["regular", "dua", "prayer"] as const;

export type ActType = (typeof ACT_TYPES)[number];

/** The sunnah prayers an Admin can start a prayer Act from. */
export const SUNNAH_PRAYER_PRESET_KEYS = [
  "fajr-nafila",
  "dhuhr-nafila",
  "asr-nafila",
  "maghrib-nafila",
  "isha-nafila",
  "night-prayer",
] as const;

export type SunnahPrayerPresetKey = (typeof SUNNAH_PRAYER_PRESET_KEYS)[number];

/** What an Act asks of the Believer, by its type. */
export const actDetailSchema = z.discriminatedUnion("type", [
  z.object({ type: z.literal("regular") }),
  z.object({
    type: z.literal("dua"),
    /** The supplication itself, in Arabic. */
    arabic: z.string().trim().min(1).max(TEXT_MAX_LENGTH),
    transliteration: z.string().trim().max(TEXT_MAX_LENGTH),
    /** Its meaning in English (Arabic readers read it as written). */
    translation: z.string().trim().max(TEXT_MAX_LENGTH),
    instructions: bilingualTextSchema,
    audioUrl: z.url({ protocol: /^https?$/u }).nullable(),
  }),
  z.object({
    type: z.literal("prayer"),
    /** The sunnah prayer it was made from; null for any other prayer. */
    preset: z.enum(SUNNAH_PRAYER_PRESET_KEYS).nullable(),
    rakahs: z.number().int().min(1).max(MAX_RAKAHS),
    steps: bilingualTextSchema,
    adhkar: bilingualTextSchema,
    requiresWudu: z.boolean(),
  }),
]);

export type ActDetail = z.output<typeof actDetailSchema>;

/** One entry in a Program. */
export const actSchema = z.object({
  id: z.string().trim().min(1),
  name: bilingualNameSchema,
  description: bilingualTextSchema,
  schedule: actScheduleSchema,
  salah: actSalahSchema,
  detail: actDetailSchema,
});

export type Act = z.output<typeof actSchema>;
export type ActInput = z.input<typeof actSchema>;

/** A recurring span of Hijri days, both ends included. */
export const hijriWindowSchema = z.object({
  start: z.object({ month: hijriMonthSchema, day: hijriDaySchema }),
  end: z.object({ month: hijriMonthSchema, day: hijriDaySchema }),
});

export const PROGRAM_CATEGORIES = ["general", "seasonal"] as const;

/** An Official Program's category: General all year, Seasonal in its window. */
export type ProgramCategory = (typeof PROGRAM_CATEGORIES)[number];

const programFieldsSchema = z.object({
  id: z.string().trim().min(1),
  name: bilingualNameSchema,
  description: bilingualTextSchema,
  /** Inactive Programs are hidden from devices, kept for the Admins. */
  active: z.boolean(),
  /** In the order the Admins set. */
  acts: z
    .array(actSchema)
    .refine(
      (acts) => new Set(acts.map(({ id }) => id)).size === acts.length,
      "Each Act needs its own id"
    ),
});

/**
 * A Program published by the Admins. A Seasonal one carries its Hijri window
 * as month/day pairs, so it comes round every year.
 */
export const officialProgramSchema = z.discriminatedUnion("category", [
  programFieldsSchema.extend({ category: z.literal("general") }),
  programFieldsSchema.extend({
    category: z.literal("seasonal"),
    window: hijriWindowSchema,
  }),
]);

export type OfficialProgram = z.output<typeof officialProgramSchema>;
export type OfficialProgramInput = z.input<typeof officialProgramSchema>;

/** What decides whether a Program shows: its state and season. */
export type ProgramAvailability = Pick<OfficialProgram, "active"> &
  ({ category: "general" } | { category: "seasonal"; window: HijriWindow });

/**
 * Whether a Believer can see an Official Program on a Hijri Date: an active
 * General one always, an active Seasonal one only within its window.
 */
export const isProgramAvailable = (
  program: ProgramAvailability,
  today: HijriDate
): boolean =>
  program.active &&
  (program.category === "general" || isInHijriWindow(today, program.window));

/** The Programs a Believer can browse today, in the Admins' order. */
export const availablePrograms = <P extends ProgramAvailability>(
  programs: readonly P[],
  today: HijriDate
): P[] => programs.filter((program) => isProgramAvailable(program, today));
