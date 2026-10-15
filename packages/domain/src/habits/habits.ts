import type { Temporal } from "temporal-polyfill";
import { z } from "zod";

import type { HabitSchedule } from "../shared";

/** The default Habits every new Believer starts with, by preset key. */
export const HABIT_PRESETS = [
  "quran-page",
  "morning-adhkar",
  "evening-adhkar",
  "drink-water",
] as const;

export type HabitPreset = (typeof HABIT_PRESETS)[number];

export const habitPresetSchema = z.enum(HABIT_PRESETS);

/**
 * A Habit the Believer keeps. A default Habit carries its `preset` (and no
 * name), so the app names it in the Believer's language.
 */
export interface Habit {
  id: string;
  name: string | null;
  preset: HabitPreset | null;
  schedule: HabitSchedule;
  /** Minutes after local midnight its Reminder fires, or null for none. */
  reminderAt: number | null;
  archived: boolean;
  /** Epoch ms. */
  createdAt: number;
}

export const MAX_HABIT_NAME_LENGTH = 80;

export const habitNameSchema = z
  .string()
  .trim()
  .min(1)
  .max(MAX_HABIT_NAME_LENGTH);

const MINUTES_PER_DAY = 1440;

/** A minute of the local day, for a Reminder. */
export const reminderAtSchema = z
  .number()
  .int()
  .min(0)
  .max(MINUTES_PER_DAY - 1);

/** What the Believer fills in to create a Habit. */
export interface HabitDraft {
  name: string;
  schedule: HabitSchedule;
  reminderAt: number | null;
}

/**
 * The defaults, seeded once per Believer. Their ids are fixed, so seeding on
 * two devices makes the same rows and sync merges them.
 */
export const DEFAULT_HABITS: readonly Omit<Habit, "createdAt">[] =
  HABIT_PRESETS.map((preset) => ({
    id: `default:${preset}`,
    name: null,
    preset,
    schedule: { kind: "daily" },
    reminderAt: null,
    archived: false,
  }));

/** A Habit can be ticked for today or a past date, never a future one. */
export class FutureHabitDateError extends Error {
  constructor(date: Temporal.PlainDate) {
    super(`A Habit cannot be ticked for a future date (${date.toString()})`);
    this.name = "FutureHabitDateError";
  }
}
