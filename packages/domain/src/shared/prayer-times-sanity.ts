import { Temporal } from "temporal-polyfill";

import { PRAYER_TIMES } from "./prayer-times";
import type { PrayerTimeName, PrayerTimes } from "./prayer-times";

/**
 * Something wrong with a day's Prayer Times: one that could not be
 * calculated (`undefined`), or one that falls before the Prayer Time that
 * should come first (`outOfOrder`, with the visible time it falls before).
 */
export type PrayerTimesProblem =
  | { kind: "undefined"; name: PrayerTimeName }
  | { kind: "outOfOrder"; name: PrayerTimeName; before: PrayerTimeName };

/**
 * The problems in a day's visible Prayer Times, for the warning banner. The
 * Prayer Times a Believer hides are not checked: they cannot be wrong on
 * screen. Each problem is reported once, at the later time of a bad pair.
 */
export const prayerTimesSanity = (
  times: PrayerTimes,
  hidden: readonly PrayerTimeName[] = []
): PrayerTimesProblem[] => {
  const problems: PrayerTimesProblem[] = [];
  let previous: { name: PrayerTimeName; at: Temporal.ZonedDateTime } | null =
    null;
  for (const name of PRAYER_TIMES) {
    if (hidden.includes(name)) {
      continue;
    }
    const at = times[name];
    if (at === null) {
      problems.push({ kind: "undefined", name });
    } else {
      if (previous && Temporal.ZonedDateTime.compare(at, previous.at) < 0) {
        problems.push({ kind: "outOfOrder", name, before: previous.name });
      }
      previous = { name, at };
    }
  }
  return problems;
};

/**
 * From this latitude (degrees, north or south) the sun stays shallower than
 * 18° below the horizon around the summer solstice (90° − 18° − 23.44°), so
 * the angle of Fajr or Isha can be unreachable.
 */
export const HIGH_LATITUDE_DEGREES = 48.5;

/** Whether a place is far enough from the equator for the rule to matter. */
export const isHighLatitude = (latitude: number): boolean =>
  Math.abs(latitude) >= HIGH_LATITUDE_DEGREES;
