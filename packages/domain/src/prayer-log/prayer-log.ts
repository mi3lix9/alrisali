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
