import { Temporal } from "temporal-polyfill";

import type { HijriCalendar, HijriMonth } from "./hijri";
import { fromShamsi, shamsiMonthLength, toShamsi } from "./shamsi";

/** The calendars the date converter reads and writes, Hijri first. */
export const CONVERTER_CALENDARS = ["hijri", "gregorian", "shamsi"] as const;

export type ConverterCalendar = (typeof CONVERTER_CALENDARS)[number];

/** A day as one calendar writes it. */
export interface CalendarDate {
  year: number;
  month: number;
  day: number;
}

/** The days the converter offers: 1900 to 2100. */
export const CONVERTER_RANGE = {
  earliest: Temporal.PlainDate.from("1900-01-01"),
  latest: Temporal.PlainDate.from("2100-12-31"),
} as const;

export interface DateConverter {
  /** How `calendar` writes a day. */
  read: (calendar: ConverterCalendar, date: Temporal.PlainDate) => CalendarDate;
  /**
   * The day `calendar` writes as `date`. A day past the month's end falls on
   * its last day, and a date outside the range on the range's nearest end.
   */
  toDate: (
    calendar: ConverterCalendar,
    date: CalendarDate
  ) => Temporal.PlainDate;
  monthLength: (
    calendar: ConverterCalendar,
    year: number,
    month: number
  ) => number;
  /** The years of `calendar` the range touches. */
  years: (calendar: ConverterCalendar) => { first: number; last: number };
}

/**
 * Converts between Hijri, Gregorian and Shamsi. Hijri Dates come from `hijri`,
 * so they carry its Hijri Adjustment, as every other Hijri Date in the app.
 */
export const createDateConverter = ({
  hijri,
}: {
  hijri: HijriCalendar;
}): DateConverter => {
  const read: DateConverter["read"] = (calendar, date) => {
    switch (calendar) {
      case "hijri": {
        return hijri.toHijri(date);
      }
      case "gregorian": {
        return { year: date.year, month: date.month, day: date.day };
      }
      case "shamsi": {
        return toShamsi(date);
      }
      default: {
        throw new RangeError(`Unknown calendar ${calendar satisfies never}`);
      }
    }
  };

  const monthLength: DateConverter["monthLength"] = (calendar, year, month) => {
    switch (calendar) {
      case "hijri": {
        return hijri.monthLength(year, month as HijriMonth);
      }
      case "gregorian": {
        return Temporal.PlainYearMonth.from({ year, month }).daysInMonth;
      }
      case "shamsi": {
        return shamsiMonthLength(year, month);
      }
      default: {
        throw new RangeError(`Unknown calendar ${calendar satisfies never}`);
      }
    }
  };

  const unclamped = (
    calendar: ConverterCalendar,
    date: CalendarDate
  ): Temporal.PlainDate => {
    switch (calendar) {
      case "hijri": {
        return hijri.toGregorian({ ...date, month: date.month as HijriMonth });
      }
      case "gregorian": {
        return Temporal.PlainDate.from(date);
      }
      case "shamsi": {
        return fromShamsi(date);
      }
      default: {
        throw new RangeError(`Unknown calendar ${calendar satisfies never}`);
      }
    }
  };

  const toDate: DateConverter["toDate"] = (calendar, date) => {
    const found = unclamped(calendar, {
      ...date,
      day: Math.min(date.day, monthLength(calendar, date.year, date.month)),
    });
    if (Temporal.PlainDate.compare(found, CONVERTER_RANGE.earliest) < 0) {
      return CONVERTER_RANGE.earliest;
    }
    if (Temporal.PlainDate.compare(found, CONVERTER_RANGE.latest) > 0) {
      return CONVERTER_RANGE.latest;
    }
    return found;
  };

  return {
    read,
    toDate,
    monthLength,
    years: (calendar) => ({
      first: read(calendar, CONVERTER_RANGE.earliest).year,
      last: read(calendar, CONVERTER_RANGE.latest).year,
    }),
  };
};

/** The calendars a date picked in `source` is shown in, in their order. */
export const convertedCalendars = (
  source: ConverterCalendar
): ConverterCalendar[] =>
  CONVERTER_CALENDARS.filter((calendar) => calendar !== source);

/** Swapping makes the first converted calendar the source. */
export const swapCalendar = (source: ConverterCalendar): ConverterCalendar =>
  convertedCalendars(source)[0] ?? source;
