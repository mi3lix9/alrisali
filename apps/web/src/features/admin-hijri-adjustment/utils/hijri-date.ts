import {
  createHijriCalendar,
  defaultHijriConverter,
  effectiveHijriAdjustment,
} from "@alrisali/domain/shared";
import type {
  AdminHijriAdjustment,
  ForcedHijriDate,
  HijriDate,
} from "@alrisali/domain/shared";
import { Temporal } from "temporal-polyfill";

import { HIJRI_MONTH_NAMES } from "@/shared/lib/hijri-months";

const converter = defaultHijriConverter();

/** How long a new forced date lasts unless the Admin changes it. */
const FORCED_DAYS = 29;

/** "4 Jumada al-Ula 1448 AH". */
export const formatHijriDate = ({ day, month, year }: HijriDate): string =>
  `${day} ${HIJRI_MONTH_NAMES[month]} ${year} AH`;

/**
 * Today's Hijri Date for a Believer with no adjustment of their own, once
 * the Admins' adjustment applies (their forced date while it lasts).
 */
export const todayInHijri = (admin: AdminHijriAdjustment): string => {
  const today = Temporal.Now.plainDateISO();
  const adjustment = effectiveHijriAdjustment({
    admin,
    believer: 0,
    today,
    converter,
  });
  return formatHijriDate(
    createHijriCalendar({ adjustment, converter }).toHijri(today)
  );
};

/** Whether the forced date applies today, has yet to start, or expired. */
export const forcedDateStatus = ({
  from,
  until,
}: Pick<ForcedHijriDate, "from" | "until">):
  | "upcoming"
  | "active"
  | "expired" => {
  const today = Temporal.Now.plainDateISO().toString();
  if (today < from) {
    return "upcoming";
  }
  return today > until ? "expired" : "active";
};

/**
 * A forced date to start editing from: today, as it shows with the offset,
 * lasting about a month.
 */
export const forcedDateFromToday = (offset: number): ForcedHijriDate => {
  const today = Temporal.Now.plainDateISO();
  return {
    date: createHijriCalendar({ adjustment: offset, converter }).toHijri(today),
    from: today.toString(),
    until: today.add({ days: FORCED_DAYS }).toString(),
  };
};
