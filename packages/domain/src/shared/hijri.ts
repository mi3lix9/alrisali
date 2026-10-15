import { Temporal } from "temporal-polyfill";
import { z } from "zod";

// Hijri Dates follow Umm al-Qura, read through Intl. An engine whose Intl does
// not honour the Islamic calendar (Hermes may ignore `-u-ca-…`) gets the
// tabular arithmetic calendar instead, which can differ by a day or two.
//
// Internally days are Julian Day Numbers, so conversions avoid Date maths.

export const HIJRI_MONTHS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12] as const;

export type HijriMonth = (typeof HIJRI_MONTHS)[number];

export interface HijriDate {
  year: number;
  month: HijriMonth;
  day: number;
}

/** A Hijri month of a given year. */
export interface HijriYearMonth {
  year: number;
  month: HijriMonth;
}

/** A recurring Hijri day, the same every year. */
export interface HijriMonthDay {
  month: HijriMonth;
  day: number;
}

/** The longest a Hijri month runs. */
export const MAX_HIJRI_MONTH_LENGTH = 30;

export const hijriMonthSchema = z
  .number()
  .int()
  .min(1)
  .max(12)
  .transform((month) => month as HijriMonth);

/** A day of a Hijri month; day 30 falls on the 29th in a 29-day month. */
export const hijriDaySchema = z
  .number()
  .int()
  .min(1)
  .max(MAX_HIJRI_MONTH_LENGTH);

/** How far the Believer may shift the Hijri Date themselves. */
export const HIJRI_ADJUSTMENT_LIMIT = 2;

export const DEFAULT_HIJRI_ADJUSTMENT = 0;

/** The Believer's own Hijri Adjustment, in whole days. */
export const hijriAdjustmentSchema = z
  .number()
  .int()
  .min(-HIJRI_ADJUSTMENT_LIMIT)
  .max(HIJRI_ADJUSTMENT_LIMIT);

/**
 * The shift applied to every computed Hijri Date: the Admins' adjustment for
 * everyone plus the Believer's own. Positive moves the Hijri Date ahead.
 */
export const effectiveHijriAdjustment = ({
  admin,
  believer,
}: {
  admin: number;
  believer: number;
}): number => admin + believer;

/** Turns a Julian Day Number into the computed (unadjusted) Hijri Date. */
export interface HijriConverter {
  readonly kind: "umm-al-qura" | "tabular";
  toHijri: (julianDay: number) => HijriDate;
}

const DAYS_PER_MONTH_FLOOR = 29;
const MONTHS_PER_YEAR = 12;
/** Days in a 30-year cycle of the tabular calendar. */
const TABULAR_CYCLE_DAYS = 10_631;
/** Julian Day Number of 1 Muharram 1 AH in the tabular (civil) calendar. */
const TABULAR_EPOCH = 1_948_440;
/** Offsets the year estimate so it lands on the year holding the day. */
const TABULAR_YEAR_OFFSET = 10_646;

const gregorianToJulianDay = (year: number, month: number, day: number) => {
  const shift = Math.floor((14 - month) / MONTHS_PER_YEAR);
  const y = year + 4800 - shift;
  const m = month + MONTHS_PER_YEAR * shift - 3;
  return (
    day +
    Math.floor((153 * m + 2) / 5) +
    365 * y +
    Math.floor(y / 4) -
    Math.floor(y / 100) +
    Math.floor(y / 400) -
    32_045
  );
};

const julianDayToGregorian = (julianDay: number): Temporal.PlainDate => {
  const a = julianDay + 32_044;
  const b = Math.floor((4 * a + 3) / 146_097);
  const c = a - Math.floor((146_097 * b) / 4);
  const d = Math.floor((4 * c + 3) / 1461);
  const e = c - Math.floor((1461 * d) / 4);
  const m = Math.floor((5 * e + 2) / 153);
  return new Temporal.PlainDate(
    100 * b + d - 4800 + Math.floor(m / 10),
    m + 3 - MONTHS_PER_YEAR * Math.floor(m / 10),
    e - Math.floor((153 * m + 2) / 5) + 1
  );
};

const toJulianDay = (date: Temporal.PlainDate) =>
  gregorianToJulianDay(date.year, date.month, date.day);

/** Julian Day Number of a tabular Hijri Date (leap years 2, 5, 7, 10, …). */
const tabularToJulianDay = ({ year, month, day }: HijriDate) =>
  day +
  Math.ceil(DAYS_PER_MONTH_FLOOR * (month - 1) + (month - 1) / 2) +
  (year - 1) * 354 +
  Math.floor((3 + 11 * year) / 30) +
  TABULAR_EPOCH -
  1;

const asHijriMonth = (month: number): HijriMonth => {
  const parsed = HIJRI_MONTHS.find((candidate) => candidate === month);
  if (parsed === undefined) {
    throw new RangeError(`${month} is not a Hijri month`);
  }
  return parsed;
};

/** The arithmetic (civil, 30-year cycle) Hijri calendar. */
export const tabularHijriConverter: HijriConverter = {
  kind: "tabular",
  toHijri: (julianDay) => {
    const year = Math.floor(
      (30 * (julianDay - TABULAR_EPOCH) + TABULAR_YEAR_OFFSET) /
        TABULAR_CYCLE_DAYS
    );
    const yearStart = tabularToJulianDay({ year, month: 1, day: 1 });
    const month = asHijriMonth(
      Math.min(
        MONTHS_PER_YEAR,
        Math.ceil((julianDay - yearStart - DAYS_PER_MONTH_FLOOR) / 29.5) + 1
      )
    );
    const day = julianDay - tabularToJulianDay({ year, month, day: 1 }) + 1;
    return { year, month, day };
  },
};

/** The part of `Intl.DateTimeFormat` the Umm al-Qura converter needs. */
export interface DateTimeFormatLike {
  formatToParts: (date: Date) => Intl.DateTimeFormatPart[];
}

/** Builds the formatter; tests swap in engines that misbehave. */
export type CreateDateTimeFormat = (
  locale: string,
  options: Intl.DateTimeFormatOptions
) => DateTimeFormatLike;

const createIntlFormat: CreateDateTimeFormat = (locale, options) =>
  new Intl.DateTimeFormat(locale, options);

const ARABIC_INDIC_ZERO = 0x06_60;
const EXTENDED_ARABIC_INDIC_ZERO = 0x06_f0;
const DIGIT_COUNT = 10;
const NON_LATIN_DIGIT = /[\u0660-\u0669\u06F0-\u06F9]/gu;

const latinDigits = (text: string) =>
  text.replaceAll(NON_LATIN_DIGIT, (digit) => {
    const code = digit.codePointAt(0) ?? 0;
    const zero =
      code >= EXTENDED_ARABIC_INDIC_ZERO
        ? EXTENDED_ARABIC_INDIC_ZERO
        : ARABIC_INDIC_ZERO;
    return String((code - zero) % DIGIT_COUNT);
  });

/** A day Umm al-Qura and the Gregorian calendar agree on, to probe Intl. */
const PROBE = {
  gregorian: { year: 2025, month: 3, day: 1 },
  hijri: { year: 1446, month: 9, day: 1 },
} as const;

const NOON_HOUR = 12;

/**
 * Umm al-Qura through the engine's Intl, or null when the engine does not
 * really support it (it is probed with a known date).
 */
export const createUmmAlQuraConverter = (
  createFormat: CreateDateTimeFormat = createIntlFormat
): HijriConverter | null => {
  let format: DateTimeFormatLike;
  try {
    format = createFormat("en-u-ca-islamic-umalqura-nu-latn", {
      timeZone: "UTC",
      day: "numeric",
      month: "numeric",
      year: "numeric",
    });
  } catch {
    return null;
  }

  const read = (gregorian: Temporal.PlainDate): HijriDate | null => {
    const parts = format.formatToParts(
      new Date(
        Date.UTC(gregorian.year, gregorian.month - 1, gregorian.day, NOON_HOUR)
      )
    );
    const value = (type: Intl.DateTimeFormatPartTypes) =>
      Number(
        latinDigits(parts.find((part) => part.type === type)?.value ?? "")
      );
    const year = value("year");
    const month = HIJRI_MONTHS.find(
      (candidate) => candidate === value("month")
    );
    const day = value("day");
    if (!Number.isInteger(year) || month === undefined || !(day >= 1)) {
      return null;
    }
    return { year, month, day };
  };

  let probe: HijriDate | null;
  try {
    const { year, month, day } = PROBE.gregorian;
    probe = read(new Temporal.PlainDate(year, month, day));
  } catch {
    return null;
  }
  if (
    probe?.year !== PROBE.hijri.year ||
    probe.month !== PROBE.hijri.month ||
    probe.day !== PROBE.hijri.day
  ) {
    return null;
  }

  return {
    kind: "umm-al-qura",
    toHijri: (julianDay) => {
      const date = read(julianDayToGregorian(julianDay));
      if (!date) {
        throw new RangeError(`Intl could not convert Julian day ${julianDay}`);
      }
      return date;
    },
  };
};

/** Umm al-Qura when the engine supports it, else the tabular calendar. */
export const defaultHijriConverter = (): HijriConverter =>
  createUmmAlQuraConverter() ?? tabularHijriConverter;

/** Moves a Hijri month by `count` months, across years as needed. */
export const addHijriMonths = (
  { year, month }: HijriYearMonth,
  count: number
): HijriYearMonth => {
  const index = year * MONTHS_PER_YEAR + (month - 1) + count;
  return {
    year: Math.floor(index / MONTHS_PER_YEAR),
    month: asHijriMonth((index % MONTHS_PER_YEAR) + 1),
  };
};

/** Temporal's day of the week: 1 is Monday, 7 is Sunday. */
export type Weekday = 1 | 2 | 3 | 4 | 5 | 6 | 7;

const DAYS_PER_WEEK = 7;
const SATURDAY: Weekday = 6;

export interface HijriGridDay {
  hijri: HijriDate;
  date: Temporal.PlainDate;
}

export interface HijriMonthGrid extends HijriYearMonth {
  length: number;
  days: HijriGridDay[];
  /** Rows of seven, padded with null before the 1st and after the last day. */
  weeks: (HijriGridDay | null)[][];
}

export interface HijriCalendar {
  /** The total Hijri Adjustment this calendar applies. */
  readonly adjustment: number;
  toHijri: (date: Temporal.PlainDate) => HijriDate;
  /** Throws a RangeError for a day the month does not have. */
  toGregorian: (date: HijriDate) => Temporal.PlainDate;
  monthLength: (year: number, month: HijriMonth) => number;
  monthGrid: (
    year: number,
    month: HijriMonth,
    options?: { weekStartsOn?: Weekday }
  ) => HijriMonthGrid;
}

/** How far Umm al-Qura month starts can drift from the tabular calendar. */
const SEARCH_RADIUS = 5;

/**
 * A Hijri calendar with the Hijri Adjustment applied: the Hijri Date of a day
 * is the computed date of the day `adjustment` days later.
 */
export const createHijriCalendar = ({
  adjustment = 0,
  converter = defaultHijriConverter(),
}: { adjustment?: number; converter?: HijriConverter } = {}): HijriCalendar => {
  const monthStarts = new Map<number, number>();

  /** Julian day of the computed 1st of a month (before adjustment). */
  const monthStart = (year: number, month: HijriMonth): number => {
    const key = year * MONTHS_PER_YEAR + month;
    const cached = monthStarts.get(key);
    if (cached !== undefined) {
      return cached;
    }
    const estimate = tabularToJulianDay({ year, month, day: 1 });
    for (let distance = 0; distance <= SEARCH_RADIUS; distance += 1) {
      for (const candidate of [estimate - distance, estimate + distance]) {
        const found = converter.toHijri(candidate);
        if (found.year === year && found.month === month && found.day === 1) {
          monthStarts.set(key, candidate);
          return candidate;
        }
      }
    }
    throw new RangeError(`No start found for Hijri month ${month}/${year}`);
  };

  const monthLength = (year: number, month: HijriMonth): number => {
    const next = addHijriMonths({ year, month }, 1);
    return monthStart(next.year, next.month) - monthStart(year, month);
  };

  const toGregorian = (date: HijriDate): Temporal.PlainDate => {
    if (date.day < 1 || date.day > monthLength(date.year, date.month)) {
      throw new RangeError(
        `Hijri month ${date.month}/${date.year} has no day ${date.day}`
      );
    }
    return julianDayToGregorian(
      monthStart(date.year, date.month) + date.day - 1 - adjustment
    );
  };

  const monthGrid: HijriCalendar["monthGrid"] = (
    year,
    month,
    { weekStartsOn = SATURDAY } = {}
  ) => {
    const length = monthLength(year, month);
    const first = toGregorian({ year, month, day: 1 });
    const days = Array.from({ length }, (_, index) => ({
      hijri: { year, month, day: index + 1 },
      date: first.add({ days: index }),
    }));
    const leading =
      (first.dayOfWeek - weekStartsOn + DAYS_PER_WEEK) % DAYS_PER_WEEK;
    const cells: (HijriGridDay | null)[] = [
      ...Array.from({ length: leading }, () => null),
      ...days,
    ];
    while (cells.length % DAYS_PER_WEEK !== 0) {
      cells.push(null);
    }
    const weeks = Array.from(
      { length: cells.length / DAYS_PER_WEEK },
      (_, week) => cells.slice(week * DAYS_PER_WEEK, (week + 1) * DAYS_PER_WEEK)
    );
    return { year, month, length, days, weeks };
  };

  return {
    adjustment,
    toHijri: (date) => converter.toHijri(toJulianDay(date) + adjustment),
    toGregorian,
    monthLength,
    monthGrid,
  };
};

/** A recurring span of Hijri days, such as a Seasonal Program's. */
export interface HijriWindow {
  start: HijriMonthDay;
  end: HijriMonthDay;
}

const DAY_KEY_SCALE = 100;

/** Orders recurring Hijri days within a year. */
const dayOfYearKey = ({ month, day }: HijriMonthDay) =>
  month * DAY_KEY_SCALE + day;

/**
 * Whether a Hijri Date falls in a window, both ends included. A window that
 * ends before it starts spans the turn of the year (Dhu al-Hijjah → Muharram).
 */
export const isInHijriWindow = (
  date: HijriDate,
  { start, end }: HijriWindow
): boolean => {
  const at = dayOfYearKey(date);
  const from = dayOfYearKey(start);
  const to = dayOfYearKey(end);
  return from <= to ? at >= from && at <= to : at >= from || at <= to;
};
