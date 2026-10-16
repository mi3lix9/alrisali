import type { Temporal } from "temporal-polyfill";

import {
  formatGregorianDate,
  useFormatHijriDate,
  useHijriCalendar,
} from "@/shared/lib/hijri-calendar";

/** Writes a day in Hijri and Gregorian, the way the finish date is shown. */
export const useDayLabels = (): ((day: Temporal.PlainDate) => {
  hijri: string;
  gregorian: string;
}) => {
  const calendar = useHijriCalendar();
  const formatHijri = useFormatHijriDate();
  return (day) => ({
    hijri: formatHijri(calendar.toHijri(day)),
    gregorian: formatGregorianDate(day),
  });
};
