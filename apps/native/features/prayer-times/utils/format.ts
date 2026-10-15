import type { TimeFormat } from "@alrisali/domain/shared";
import { getCalendars } from "expo-localization";
import type { Temporal } from "temporal-polyfill";

import { launchLanguage } from "@/shared/lib/preferences";

/** The Believer's time format, or the device's clock setting if unset. */
export const effectiveTimeFormat = (chosen: TimeFormat | null): TimeFormat => {
  if (chosen) {
    return chosen;
  }
  return getCalendars()[0]?.uses24hourClock === false ? "12h" : "24h";
};

const timeFormatters = new Map<string, Intl.DateTimeFormat>();

/** A clock time such as "18:52" or "6:52 PM", in the time's own zone. */
export const formatClockTime = (
  time: Temporal.ZonedDateTime,
  format: TimeFormat
): string => {
  const key = `${format}|${time.timeZoneId}`;
  let formatter = timeFormatters.get(key);
  if (!formatter) {
    formatter = new Intl.DateTimeFormat(launchLanguage, {
      hour: "numeric",
      minute: "2-digit",
      hour12: format === "12h",
      timeZone: time.timeZoneId,
    });
    timeFormatters.set(key, formatter);
  }
  return formatter.format(time.epochMilliseconds);
};

const SECONDS_PER_MINUTE = 60;
const SECONDS_PER_HOUR = 3600;
const twoDigits = new Intl.NumberFormat(launchLanguage, {
  minimumIntegerDigits: 2,
  useGrouping: false,
});
const plain = new Intl.NumberFormat(launchLanguage, { useGrouping: false });

/** A countdown such as "2:05:09" from whole seconds left. */
export const formatCountdown = (secondsLeft: number): string => {
  const total = Math.max(0, Math.floor(secondsLeft));
  const hours = Math.floor(total / SECONDS_PER_HOUR);
  const minutes = Math.floor((total % SECONDS_PER_HOUR) / SECONDS_PER_MINUTE);
  const seconds = total % SECONDS_PER_MINUTE;
  return `${plain.format(hours)}:${twoDigits.format(minutes)}:${twoDigits.format(seconds)}`;
};
