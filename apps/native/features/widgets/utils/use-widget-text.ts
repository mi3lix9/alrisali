import "../i18n";
import { SURAHS } from "@alrisali/content/quran";
import type { TimeFormat } from "@alrisali/domain/shared";
import type { WidgetText } from "@alrisali/domain/widgets";
import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { Temporal } from "temporal-polyfill";

import {
  formatGregorianDate,
  useHijriMonthName,
} from "@/shared/lib/hijri-calendar";
import { formatDateTime, formatNumber } from "@/shared/lib/numbers";

const FULL_DATE: Intl.DateTimeFormatOptions = {
  weekday: "long",
  day: "numeric",
  month: "long",
  year: "numeric",
};

/**
 * The words the widgets show, in the app's language and digits. The widgets
 * cannot translate or format on their own, so the app writes the words into
 * what it hands them; a language change (a relaunch) rewrites them.
 */
export const useWidgetText = (timeFormat: TimeFormat): WidgetText => {
  const { t, i18n } = useTranslation("widgets");
  const { t: tCommon } = useTranslation();
  const monthName = useHijriMonthName();
  const { language } = i18n;
  return useMemo(() => {
    const surahName = (surah: number): string => {
      const entry = SURAHS[surah - 1];
      return (language === "ar" ? entry?.nameAr : entry?.nameEn) ?? "";
    };
    const reference = (surah: number, ayah: number): string =>
      t("reference", { surah: surahName(surah), ayah: formatNumber(ayah) });
    return {
      titles: {
        "next-salah": t("titles.nextSalah"),
        "today-times": t("titles.todayTimes"),
        "hijri-date": t("titles.hijriDate"),
        "verse-of-the-day": t("titles.verseOfTheDay"),
        "keep-reading": t("titles.keepReading"),
        khatmah: t("titles.khatmah"),
      },
      prayerName: (name) => t(`names.${name}`),
      clock: (at, timeZone) =>
        formatDateTime(at, {
          hour: "numeric",
          minute: "2-digit",
          hour12: timeFormat === "12h",
          timeZone,
        }),
      digits: Array.from({ length: 10 }, (_, digit) => formatNumber(digit)),
      remaining: (time) => t("remaining", { time }),
      noLocation: t("noLocation"),
      following: (prayer, time) => t("following", { prayer, time }),
      hijriDay: ({ day }) => formatNumber(day),
      hijriMonthYear: ({ month, year }) =>
        tCommon("hijri.monthYear", { month: monthName(month), year }),
      gregorianDate: (date) =>
        formatGregorianDate(Temporal.PlainDate.from(date), FULL_DATE),
      reference,
      page: (page) => t("page", { page: formatNumber(page) }),
      startReading: t("startReading"),
      khatmahProgress: (done, total) =>
        t("khatmah.progress", {
          done: formatNumber(done),
          total: formatNumber(total),
        }),
      khatmahToday: (portion) => t("khatmah.today", { portion }),
      khatmahDoneToday: t("khatmah.doneToday"),
      khatmahState: (state, sessions) =>
        t(`khatmah.${state}`, { count: formatNumber(sessions) }),
      startKhatmah: t("khatmah.start"),
    };
  }, [t, tCommon, language, monthName, timeFormat]);
};
