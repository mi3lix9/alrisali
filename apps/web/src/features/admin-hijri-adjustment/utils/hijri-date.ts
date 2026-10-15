import {
  createHijriCalendar,
  defaultHijriConverter,
} from "@alrisali/domain/shared";
import { Temporal } from "temporal-polyfill";

import { HIJRI_MONTH_NAMES } from "@/shared/lib/hijri-months";

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
  return `${day} ${HIJRI_MONTH_NAMES[month]} ${year} AH`;
};
