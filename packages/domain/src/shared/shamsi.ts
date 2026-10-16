import { Temporal } from "temporal-polyfill";

// The Shamsi (Solar Hijri) calendar: the year starts at Nowruz, the March
// equinox as seen from Tehran. Its leap years follow Kazimierz Borkowski's
// 33-year-cycle rules, whose break years keep it on the astronomical
// calendar for years -61 to 3177. Pure arithmetic: Hermes may not honour
// Intl's `persian` calendar.

/** A Shamsi Date: 1 Farvardin 1405 is 21 March 2026. */
export interface ShamsiDate {
  year: number;
  /** 1 is Farvardin, 12 is Esfand. */
  month: number;
  day: number;
}

export const SHAMSI_MONTHS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12] as const;

/** Years where the 33-year cycle's leap pattern shifts. */
const BREAKS = [
  -61, 9, 38, 199, 426, 686, 756, 818, 1111, 1181, 1210, 1635, 2060, 2097, 2192,
  2262, 2324, 2394, 2456, 3178,
] as const;
const [FIRST_YEAR] = BREAKS;
const LAST_YEAR = BREAKS.at(-1) ?? FIRST_YEAR;

/** Shamsi years run 621 years behind the Gregorian year their Nowruz is in. */
const GREGORIAN_OFFSET = 621;
const CYCLE_YEARS = 33;
const LEAPS_PER_CYCLE = 8;
const FIRST_HALF_MONTHS = 6;
const LONG_MONTH = 31;
const SHORT_MONTH = 30;
const ESFAND = 12;
const MARCH = 3;

/** Integer division towards zero, as the published algorithm uses. */
const div = (a: number, b: number) => Math.trunc(a / b);
const mod = (a: number, b: number) => a - div(a, b) * b;

interface ShamsiYear {
  /** Whether the year's Esfand has a 30th day. */
  leap: boolean;
  /** The Gregorian day of its Nowruz. */
  nowruz: Temporal.PlainDate;
}

const shamsiYear = (year: number): ShamsiYear => {
  if (!Number.isInteger(year) || year < FIRST_YEAR || year >= LAST_YEAR) {
    throw new RangeError(`Shamsi year ${year} is out of range`);
  }
  const gregorianYear = year + GREGORIAN_OFFSET;
  let leapDays = -14;
  let previousBreak: number = FIRST_YEAR;
  let jump = 0;
  for (const nextBreak of BREAKS.slice(1)) {
    jump = nextBreak - previousBreak;
    if (year < nextBreak) {
      break;
    }
    leapDays +=
      div(jump, CYCLE_YEARS) * LEAPS_PER_CYCLE + div(mod(jump, CYCLE_YEARS), 4);
    previousBreak = nextBreak;
  }
  let sinceBreak = year - previousBreak;
  leapDays +=
    div(sinceBreak, CYCLE_YEARS) * LEAPS_PER_CYCLE +
    div(mod(sinceBreak, CYCLE_YEARS) + 3, 4);
  if (mod(jump, CYCLE_YEARS) === 4 && jump - sinceBreak === 4) {
    leapDays += 1;
  }
  const gregorianLeapDays =
    div(gregorianYear, 4) - div((div(gregorianYear, 100) + 1) * 3, 4) - 150;
  const marchDay = 20 + leapDays - gregorianLeapDays;
  if (jump - sinceBreak < 6) {
    sinceBreak = sinceBreak - jump + div(jump + 4, CYCLE_YEARS) * CYCLE_YEARS;
  }
  const leapIndex = mod(mod(sinceBreak + 1, CYCLE_YEARS) - 1, 4);
  return {
    leap: leapIndex === 0,
    nowruz: new Temporal.PlainDate(gregorianYear, MARCH, marchDay),
  };
};

/** Days in a Shamsi month: 31 to Shahrivar, 30 to Bahman, Esfand 29 or 30. */
export const shamsiMonthLength = (year: number, month: number): number => {
  if (!Number.isInteger(month) || month < 1 || month > ESFAND) {
    throw new RangeError(`Shamsi month ${month} does not exist`);
  }
  if (month <= FIRST_HALF_MONTHS) {
    return LONG_MONTH;
  }
  if (month < ESFAND) {
    return SHORT_MONTH;
  }
  return shamsiYear(year).leap ? SHORT_MONTH : SHORT_MONTH - 1;
};

/** The Shamsi Date of a Gregorian day. */
export const toShamsi = (date: Temporal.PlainDate): ShamsiDate => {
  let year = date.year - GREGORIAN_OFFSET;
  let { nowruz } = shamsiYear(year);
  if (Temporal.PlainDate.compare(date, nowruz) < 0) {
    year -= 1;
    ({ nowruz } = shamsiYear(year));
  }
  const dayOfYear = nowruz.until(date).days;
  const firstHalfDays = FIRST_HALF_MONTHS * LONG_MONTH;
  if (dayOfYear < firstHalfDays) {
    return {
      year,
      month: div(dayOfYear, LONG_MONTH) + 1,
      day: mod(dayOfYear, LONG_MONTH) + 1,
    };
  }
  const intoSecondHalf = dayOfYear - firstHalfDays;
  return {
    year,
    month: FIRST_HALF_MONTHS + div(intoSecondHalf, SHORT_MONTH) + 1,
    day: mod(intoSecondHalf, SHORT_MONTH) + 1,
  };
};

/** The Gregorian day of a Shamsi Date; a RangeError for a day it lacks. */
export const fromShamsi = ({
  year,
  month,
  day,
}: ShamsiDate): Temporal.PlainDate => {
  if (
    !Number.isInteger(day) ||
    day < 1 ||
    day > shamsiMonthLength(year, month)
  ) {
    throw new RangeError(`Shamsi month ${month}/${year} has no day ${day}`);
  }
  const daysBeforeMonth =
    month <= FIRST_HALF_MONTHS
      ? (month - 1) * LONG_MONTH
      : FIRST_HALF_MONTHS * LONG_MONTH +
        (month - 1 - FIRST_HALF_MONTHS) * SHORT_MONTH;
  return shamsiYear(year).nowruz.add({ days: daysBeforeMonth + day - 1 });
};
