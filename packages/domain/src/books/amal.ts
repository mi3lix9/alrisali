import { AMAL } from "@alrisali/content/books";
import type { AmalEntry } from "@alrisali/content/books";

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
