import { currentPrayerTime, nextPrayerTime } from "@alrisali/domain/shared";
import type {
  PrayerTimeAt,
  PrayerTimeName,
  PrayerTimesSettings,
} from "@alrisali/domain/shared";
import type { Temporal } from "temporal-polyfill";

export interface NextPrayerProgress {
  /** The visible Prayer Time in progress, or null before any is known. */
  current: PrayerTimeAt | null;
  next: PrayerTimeAt;
  secondsLeft: number;
  /** How far `now` is from `current` to `next`, from 0 to 1. */
  fraction: number;
}

/**
 * The countdown to the next visible Prayer Time and how far the Believer is
 * through the span since the previous one. After the last time of the day
 * the next is tomorrow's first visible one; hidden times are skipped. Null
 * when no Prayer Time is visible.
 */
export const nextPrayerProgress = (
  now: Temporal.ZonedDateTime,
  settings: PrayerTimesSettings,
  hidden: readonly PrayerTimeName[]
): NextPrayerProgress | null => {
  const next = nextPrayerTime(now, settings, hidden);
  if (!next) {
    return null;
  }
  const current = currentPrayerTime(now, settings, hidden);
  const secondsLeft = next.at.since(now).total("seconds");
  const span = current
    ? next.at.epochMilliseconds - current.at.epochMilliseconds
    : 0;
  const elapsed = current
    ? now.epochMilliseconds - current.at.epochMilliseconds
    : 0;
  const fraction = span > 0 ? Math.min(1, Math.max(0, elapsed / span)) : 0;
  return { current, next, secondsLeft, fraction };
};
