import {
  createHijriCalendar,
  defaultHijriConverter,
} from "@alrisali/domain/shared";
import type { HijriMonth } from "@alrisali/domain/shared";
import { Temporal } from "temporal-polyfill";

const MONTHS = {
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

const converter = defaultHijriConverter();

/**
 * Today's Hijri Date for a Believer with no adjustment of their own, once
 * the Admins' adjustment applies: "4 Jumada al-Ula 1448 AH".
 */
export const todayInHijri = (adjustment: number): string => {
  const { day, month, year } = createHijriCalendar({
    adjustment,
    converter,
  }).toHijri(Temporal.Now.plainDateISO());
  return `${day} ${MONTHS[month]} ${year} AH`;
};
