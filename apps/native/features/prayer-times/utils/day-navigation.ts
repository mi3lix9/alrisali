import type { Temporal } from "temporal-polyfill";

/** The calendar day it is at the location, on the location's own clock. */
export const locationToday = (
  now: Temporal.Instant,
  timeZone: string
): Temporal.PlainDate => now.toZonedDateTimeISO(timeZone).toPlainDate();

/**
 * The day the Prayer screen shows after moving `days` from `shown` (`null`
 * is today, so midnight carries it along). Landing on today returns `null`.
 */
export const moveShownDay = (
  shown: Temporal.PlainDate | null,
  today: Temporal.PlainDate,
  days: number
): Temporal.PlainDate | null => {
  const moved = (shown ?? today).add({ days });
  return moved.equals(today) ? null : moved;
};
