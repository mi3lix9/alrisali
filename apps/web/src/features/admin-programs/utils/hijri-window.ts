import type { HijriMonth, HijriMonthDay } from "@alrisali/domain/shared";

export const HIJRI_MONTH_NAMES = {
  1: "Muharram",
  2: "Safar",
  3: "Rabi al-Awwal",
  4: "Rabi al-Thani",
  5: "Jumada al-Ula",
  6: "Jumada al-Akhirah",
  7: "Rajab",
  8: "Shaban",
  9: "Ramadan",
  10: "Shawwal",
  11: "Dhu al-Qadah",
  12: "Dhu al-Hijjah",
} as const satisfies Record<HijriMonth, string>;

/** A Seasonal window as "1 Ramadan – 30 Ramadan". */
export const formatHijriWindow = ({
  start,
  end,
}: {
  start: HijriMonthDay;
  end: HijriMonthDay;
}): string =>
  `${start.day} ${HIJRI_MONTH_NAMES[start.month]} – ${end.day} ${HIJRI_MONTH_NAMES[end.month]}`;

/** Whether a window ends before it starts, so it runs across the new year. */
export const wrapsNewYear = (window: {
  start: HijriMonthDay;
  end: HijriMonthDay;
}): boolean =>
  window.end.month < window.start.month ||
  (window.end.month === window.start.month &&
    window.end.day < window.start.day);
