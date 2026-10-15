import { Temporal } from "temporal-polyfill";

import { SALAH } from "../shared";
import type { Salah } from "../shared";

/** The Believer's record, for one date, of which Salah they performed. */
export interface PrayerLog {
  date: Temporal.PlainDate;
  /** In the day's order, each at most once. */
  performed: readonly Salah[];
}

/** The Prayer Log after the Believer ticks or un-ticks one Salah. */
export const setSalahPerformed = (
  log: PrayerLog,
  salah: Salah,
  performed: boolean
): PrayerLog => ({
  date: log.date,
  performed: SALAH.filter((candidate) =>
    candidate === salah ? performed : log.performed.includes(candidate)
  ),
});

/** Today or any past date can be logged; a future one cannot. */
export const canLogDate = (
  date: Temporal.PlainDate,
  today: Temporal.PlainDate
): boolean => Temporal.PlainDate.compare(date, today) <= 0;

export class FutureDateError extends Error {
  constructor(date: Temporal.PlainDate) {
    super(`A Salah cannot be logged for a future date (${date.toString()})`);
    this.name = "FutureDateError";
  }
}

/**
 * The Prayer Streak ending on `date`: the run of consecutive days, up to and
 * including it, on which all five Salah were logged. It is 0 unless `date`
 * itself is complete. Always derived from the logs, so edits to past days
 * count straight away.
 */
export const prayerStreak = (
  logs: Iterable<PrayerLog>,
  date: Temporal.PlainDate
): number => {
  const completeDays = new Set<string>();
  for (const log of logs) {
    if (SALAH.every((salah) => log.performed.includes(salah))) {
      completeDays.add(log.date.toString());
    }
  }

  let streak = 0;
  let day = date;
  while (completeDays.has(day.toString())) {
    streak += 1;
    day = day.subtract({ days: 1 });
  }
  return streak;
};
