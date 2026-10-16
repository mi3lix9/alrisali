import {
  createHijriCalendar,
  DEFAULT_HIJRI_ADJUSTMENT,
  defaultHijriConverter,
  effectiveHijriAdjustment,
} from "@alrisali/domain/shared";
import type {
  HijriCalendar,
  HijriDate,
  HijriMonth,
  HijriMonthDay,
  HijriYearMonth,
} from "@alrisali/domain/shared";
import { useCallback, useMemo } from "react";
import { useTranslation } from "react-i18next";
import type { Temporal } from "temporal-polyfill";

import { useBelieverSettings } from "./believer-settings";
import { useGlobalHijriAdjustment } from "./content-database";
import { formatDateTime } from "./numbers";

// Probes this engine's Intl for Umm al-Qura once; Hermes may not honour it,
// and then every Hijri Date comes from the arithmetic calendar.
const converter = defaultHijriConverter();

/**
 * The Hijri calendar every screen shows dates from, shifted by the Admins'
 * Hijri Adjustment plus the Believer's own.
 */
export const useHijriCalendar = (): HijriCalendar => {
  const { data: settings } = useBelieverSettings();
  const adjustment = effectiveHijriAdjustment({
    admin: useGlobalHijriAdjustment(),
    believer: settings?.hijriAdjustment ?? DEFAULT_HIJRI_ADJUSTMENT,
  });
  return useMemo(
    () => createHijriCalendar({ adjustment, converter }),
    [adjustment]
  );
};

const MONTH_KEYS = {
  1: "muharram",
  2: "safar",
  3: "rabiAlAwwal",
  4: "rabiAlThani",
  5: "jumadaAlUla",
  6: "jumadaAlAkhirah",
  7: "rajab",
  8: "shaban",
  9: "ramadan",
  10: "shawwal",
  11: "dhuAlQadah",
  12: "dhuAlHijjah",
} as const satisfies Record<HijriMonth, string>;

/** Writes a recurring Hijri day in the app's language: "1 Ramadan". */
export const useFormatHijriMonthDay = () => {
  const { t } = useTranslation();
  return useCallback(
    ({ month, day }: HijriMonthDay) =>
      t("hijri.dayMonth", {
        day,
        month: t(`hijri.months.${MONTH_KEYS[month]}`),
      }),
    [t]
  );
};

/**
 * Writes a Hijri Date in the app's language ("4 Jumada al-Ula 1448 AH"), or
 * a Hijri month when given no day ("Jumada al-Ula 1448 AH").
 */
export const useFormatHijriDate = () => {
  const { t } = useTranslation();
  return useCallback(
    (date: HijriDate | HijriYearMonth) => {
      const month = t(`hijri.months.${MONTH_KEYS[date.month]}`);
      return "day" in date
        ? t("hijri.date", { day: date.day, month, year: date.year })
        : t("hijri.monthYear", { month, year: date.year });
    },
    [t]
  );
};

const LONG_DATE: Intl.DateTimeFormatOptions = {
  day: "numeric",
  month: "long",
  year: "numeric",
};

/** Writes a Gregorian day in the app's language and digits: "15 October 2026". */
export const formatGregorianDate = (
  date: Temporal.PlainDate,
  options?: Intl.DateTimeFormatOptions
): string =>
  formatDateTime(date, { calendar: "gregory", ...(options ?? LONG_DATE) });
