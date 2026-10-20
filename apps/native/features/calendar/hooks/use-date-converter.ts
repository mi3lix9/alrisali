import {
  createDateConverter,
  toShamsi,
  writeDigits,
} from "@alrisali/domain/shared";
import type {
  ConverterCalendar,
  DateConverter,
  HijriMonth,
} from "@alrisali/domain/shared";
import { useCallback, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { Temporal } from "temporal-polyfill";

import {
  formatGregorianDate,
  useFormatHijriDate,
  useHijriCalendar,
  useHijriMonthName,
} from "@/shared/lib/hijri-calendar";
import { formatDateTime, useDigits } from "@/shared/lib/numbers";

/**
 * The date converter over the calendar every screen shows Hijri Dates from,
 * so its Hijri Dates carry the effective Hijri Adjustment.
 */
export const useDateConverter = (): DateConverter => {
  const hijri = useHijriCalendar();
  return useMemo(() => createDateConverter({ hijri }), [hijri]);
};

const SHAMSI_MONTH_KEYS = [
  "farvardin",
  "ordibehesht",
  "khordad",
  "tir",
  "mordad",
  "shahrivar",
  "mehr",
  "aban",
  "azar",
  "dey",
  "bahman",
  "esfand",
] as const;

/** A day and its parts written in the app's language and digits. */
export interface CalendarFormat {
  /** A whole date: "4 Jumada al-Ula 1448 AH". */
  date: (calendar: ConverterCalendar, date: Temporal.PlainDate) => string;
  /** A month's name: "Mehr". */
  month: (calendar: ConverterCalendar, month: number) => string;
  /** A day or year number, ungrouped: "1448". */
  number: (value: number) => string;
}

/** Writes the converter's days, months and numbers; Hijri as the calendar does. */
export const useCalendarFormat = (): CalendarFormat => {
  const { t } = useTranslation("calendar");
  const hijri = useHijriCalendar();
  const formatHijriDate = useFormatHijriDate();
  const hijriMonthName = useHijriMonthName();
  const digits = useDigits();

  const month = useCallback(
    (calendar: ConverterCalendar, value: number) => {
      switch (calendar) {
        case "hijri": {
          return hijriMonthName(value as HijriMonth);
        }
        case "gregorian": {
          return formatDateTime(new Temporal.PlainDate(2000, value, 1), {
            calendar: "gregory",
            month: "long",
          });
        }
        case "shamsi": {
          const key = SHAMSI_MONTH_KEYS[value - 1];
          if (key === undefined) {
            throw new RangeError(`Shamsi month ${value} does not exist`);
          }
          return t(`converter.shamsiMonths.${key}`);
        }
        default: {
          throw new RangeError(`Unknown calendar ${calendar satisfies never}`);
        }
      }
    },
    [hijriMonthName, t]
  );

  return useMemo(
    () => ({
      date: (calendar, date) => {
        switch (calendar) {
          case "hijri": {
            return formatHijriDate(hijri.toHijri(date));
          }
          case "gregorian": {
            return formatGregorianDate(date);
          }
          case "shamsi": {
            const shamsi = toShamsi(date);
            return t("converter.shamsiDate", {
              day: shamsi.day,
              month: month("shamsi", shamsi.month),
              year: shamsi.year,
            });
          }
          default: {
            throw new RangeError(
              `Unknown calendar ${calendar satisfies never}`
            );
          }
        }
      },
      month,
      number: (value) => writeDigits(String(value), digits),
    }),
    [digits, formatHijriDate, hijri, month, t]
  );
};
