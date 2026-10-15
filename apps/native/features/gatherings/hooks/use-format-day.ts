import { useCallback } from "react";
import type { Temporal } from "temporal-polyfill";

import {
  formatGregorianDate,
  useFormatHijriDate,
  useHijriCalendar,
} from "@/shared/lib/hijri-calendar";

const WITH_WEEKDAY: Intl.DateTimeFormatOptions = {
  weekday: "long",
  day: "numeric",
  month: "long",
  year: "numeric",
};

/**
 * A Gathering's day in both calendars: the Gregorian date it is published
 * on, with its weekday, and the Hijri Date it falls on.
 */
export const useFormatDay = () => {
  const calendar = useHijriCalendar();
  const formatHijriDate = useFormatHijriDate();
  return useCallback(
    (date: Temporal.PlainDate) => ({
      gregorian: formatGregorianDate(date, WITH_WEEKDAY),
      hijri: formatHijriDate(calendar.toHijri(date)),
    }),
    [calendar, formatHijriDate]
  );
};
