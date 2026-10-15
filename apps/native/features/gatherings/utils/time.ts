import { Temporal } from "temporal-polyfill";

const TIME_OF_DAY: Intl.DateTimeFormatOptions = {
  hour: "numeric",
  minute: "2-digit",
};

/** An `HH:MM` time of day in `language` with Latin digits: "7:30 PM". */
export const formatTimeOfDay = (time: string, language: string): string =>
  Temporal.PlainTime.from(time).toLocaleString(
    `${language}-u-nu-latn`,
    TIME_OF_DAY
  );

/** "7:30 PM – 9:00 PM", or only the start when there is no end time. */
export const formatTimeRange = (
  { startTime, endTime }: { startTime: string; endTime: string | null },
  language: string
): string => {
  const start = formatTimeOfDay(startTime, language);
  return endTime === null
    ? start
    : `${start} – ${formatTimeOfDay(endTime, language)}`;
};
