import { Temporal } from "temporal-polyfill";

import { formatDateTime } from "@/shared/lib/numbers";

const TIME_OF_DAY: Intl.DateTimeFormatOptions = {
  hour: "numeric",
  minute: "2-digit",
};

/** An `HH:MM` time of day in the interface's language and digits: "7:30 PM". */
export const formatTimeOfDay = (time: string): string =>
  formatDateTime(Temporal.PlainTime.from(time), TIME_OF_DAY);

/** "7:30 PM – 9:00 PM", or only the start when there is no end time. */
export const formatTimeRange = ({
  startTime,
  endTime,
}: {
  startTime: string;
  endTime: string | null;
}): string => {
  const start = formatTimeOfDay(startTime);
  return endTime === null ? start : `${start} – ${formatTimeOfDay(endTime)}`;
};
