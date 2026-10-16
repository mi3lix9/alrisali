import type { TimeFormat } from "@alrisali/domain/shared";
import type { Temporal } from "temporal-polyfill";

import {
  formatGregorianDate,
  useFormatHijriMonthDay,
} from "@/shared/lib/hijri-calendar";
import { formatDateTime, formatNumber, useDigits } from "@/shared/lib/numbers";

import type { SheetWriter } from "../utils/sheet";

const NO_TIME = "—";
const DAY_AND_MONTH = { day: "numeric", month: "short" } as const;

/** The clock time of `time` in its own zone, as the Prayer tab writes it. */
const clockTime = (time: Temporal.ZonedDateTime, format: TimeFormat) =>
  formatDateTime(time.epochMilliseconds, {
    hour: "numeric",
    minute: "2-digit",
    hour12: format === "12h",
    timeZone: time.timeZoneId,
  });

/** Writes a sheet's times and dates in the interface's language and digits. */
export const useSheetWriter = (timeFormat: TimeFormat): SheetWriter => {
  const formatHijriMonthDay = useFormatHijriMonthDay();
  // The formatters read the digits when they run; this makes the screen run
  // them again when the Believer changes them.
  useDigits();
  return {
    time: (time) => (time ? clockTime(time, timeFormat) : NO_TIME),
    number: (value) => formatNumber(value),
    gregorianDay: (date, withMonth) =>
      withMonth
        ? formatGregorianDate(date, DAY_AND_MONTH)
        : formatNumber(date.day),
    hijriDay: ({ month, day }, withMonth) =>
      withMonth ? formatHijriMonthDay({ month, day }) : formatNumber(day),
  };
};
