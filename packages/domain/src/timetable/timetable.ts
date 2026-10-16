import { Temporal } from "temporal-polyfill";

import { calculatePrayerTimes } from "../shared";
import type {
  HijriCalendar,
  HijriDate,
  HijriMonth,
  PrayerTimes,
  PrayerTimesSettings,
} from "../shared";

/** A month of the timetable: a Gregorian one, or a Hijri one. */
export type TimetableMonth =
  | { kind: "gregorian"; year: number; month: number }
  | { kind: "hijri"; year: number; month: HijriMonth };

/** One day of a monthly timetable: both dates and the day's Prayer Times. */
export interface TimetableRow {
  date: Temporal.PlainDate;
  hijri: HijriDate;
  times: PrayerTimes;
}

/** The place a timetable is for: where the times are worked out. */
export interface TimetablePlace {
  calendar: HijriCalendar;
  /** The IANA zone of the place, never the device's. */
  timeZone: string;
  settings: PrayerTimesSettings;
}

const monthDates = (
  month: TimetableMonth,
  calendar: HijriCalendar
): Temporal.PlainDate[] => {
  if (month.kind === "hijri") {
    return calendar
      .monthGrid(month.year, month.month)
      .days.map(({ date }) => date);
  }
  const first = Temporal.PlainDate.from({
    year: month.year,
    month: month.month,
    day: 1,
  });
  return Array.from({ length: first.daysInMonth }, (_, index) =>
    first.add({ days: index })
  );
};

const rowFor = (
  date: Temporal.PlainDate,
  { calendar, timeZone, settings }: TimetablePlace
): TimetableRow => ({
  date,
  hijri: calendar.toHijri(date),
  times: calculatePrayerTimes(date, timeZone, settings),
});

/**
 * Every day of a month with its Hijri and Gregorian dates and the Prayer
 * Times the Prayer tab shows for that day: each row is the domain's
 * `calculatePrayerTimes` for its date, so the two never disagree.
 */
export const monthlyTimetable = (
  month: TimetableMonth,
  place: TimetablePlace
): TimetableRow[] =>
  monthDates(month, place.calendar).map((date) => rowFor(date, place));

/**
 * The nights of Ramadan that may be Laylat al-Qadr, as the Hijri day of the
 * month each belongs to. The Hijri day begins at sunset, so night 19 is the
 * one before the daylight of the 19th, the evening of the 18th.
 */
export const LAYLAT_AL_QADR_NIGHTS = [19, 21, 23] as const;

export const RAMADAN: HijriMonth = 9;

/** One day of the Ramadan Imsakiyya. */
export interface ImsakiyyaRow {
  /** The day of Ramadan, from 1. */
  day: number;
  date: Temporal.PlainDate;
  imsak: Temporal.ZonedDateTime | null;
  fajr: Temporal.ZonedDateTime | null;
  dhuhr: Temporal.ZonedDateTime | null;
  /** Maghrib, when the fast is broken. */
  iftar: Temporal.ZonedDateTime | null;
  /** Whether the night that begins this Hijri day is a Laylat al-Qadr night. */
  qadrNight: boolean;
}

/**
 * Ramadan of a Hijri year, day by day: Imsak, Fajr, Dhuhr and Iftar, with
 * the Laylat al-Qadr nights marked. Each time is the domain Prayer Time of
 * its date.
 */
export const ramadanImsakiyya = (
  hijriYear: number,
  place: TimetablePlace
): ImsakiyyaRow[] =>
  monthlyTimetable(
    { kind: "hijri", year: hijriYear, month: RAMADAN },
    place
  ).map(({ date, hijri, times }) => ({
    day: hijri.day,
    date,
    imsak: times.imsak,
    fajr: times.fajr,
    dhuhr: times.dhuhr,
    iftar: times.maghrib,
    qadrNight: (LAYLAT_AL_QADR_NIGHTS as readonly number[]).includes(hijri.day),
  }));

/**
 * The Gregorian month that follows or precedes `month`, as the timetable's
 * arrows move it.
 */
export const shiftTimetableMonth = (
  month: TimetableMonth,
  count: number
): TimetableMonth => {
  if (month.kind === "gregorian") {
    const moved = Temporal.PlainYearMonth.from({
      year: month.year,
      month: month.month,
    }).add({ months: count });
    return { kind: "gregorian", year: moved.year, month: moved.month };
  }
  const index = month.year * 12 + (month.month - 1) + count;
  return {
    kind: "hijri",
    year: Math.floor(index / 12),
    month: ((index % 12) + 1) as HijriMonth,
  };
};
