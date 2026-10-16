import { AMAL, getSupplication } from "@alrisali/content/books";
import type { AmalEntry, AmalKind } from "@alrisali/content/books";
import { z } from "zod";

import type { HijriMonth } from "../shared";

/** The a'mal of one day of a Hijri month. */
export interface AmalDay {
  day: number;
  entries: AmalEntry[];
}

/** A Hijri month's a'mal: those of every day (day 0), and those of each day. */
export interface MonthAmal {
  wholeMonth: AmalEntry[];
  /** Days with a'mal, earliest first; entries keep the index's order. */
  days: AmalDay[];
}

/** The a'mal of a Hijri month, the whole month's listed apart from each day's. */
export const amalOfMonth = (
  month: HijriMonth,
  amal: readonly AmalEntry[] = AMAL
): MonthAmal => {
  const ofMonth = amal.filter((entry) => entry.month === month);
  const byDay = new Map<number, AmalEntry[]>();
  for (const entry of ofMonth) {
    if (entry.day !== 0) {
      byDay.set(entry.day, [...(byDay.get(entry.day) ?? []), entry]);
    }
  }
  return {
    wholeMonth: ofMonth.filter((entry) => entry.day === 0),
    days: [...byDay.entries()]
      .toSorted(([a], [b]) => a - b)
      .map(([day, entries]) => ({ day, entries })),
  };
};

/** The longest Hijri month; a day is 1 to this, or 0 for the whole month. */
export const AMAL_LAST_DAY = 30;

/** The kinds of act (the content package's `AMAL_KINDS`; a test keeps them equal). */
export const AMAL_KIND_NAMES = [
  "dua",
  "ziyarah",
  "prayer",
  "fast",
  "tasbih",
] as const satisfies readonly AmalKind[];

/** What one act of a day is: its kind, when, and the Supplication that holds its text. */
export const amalActSchema = z.object({
  kind: z.enum(AMAL_KIND_NAMES),
  time: z.enum(["night", "day"]).optional(),
  supplicationId: z
    .string()
    .refine((id) => getSupplication(id) !== undefined, "No such Supplication"),
});

/** Everything one day (or the whole month, day 0) of a Hijri month lists. */
export const amalDaySchema = z
  .object({
    month: z.int().min(1).max(12),
    day: z.int().min(0).max(AMAL_LAST_DAY),
    acts: z.array(amalActSchema).max(50),
  })
  .refine(
    ({ acts }) =>
      new Set(acts.map((act) => `${act.time ?? ""}/${act.supplicationId}`))
        .size === acts.length,
    "A Supplication is listed once for the same time of a day"
  );

export type AmalDayInput = z.infer<typeof amalDaySchema>;
