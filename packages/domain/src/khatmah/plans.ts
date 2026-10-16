import {
  AYAT,
  byMeaningRanges,
  HIZB_QUARTER_STARTS,
} from "@alrisali/content/quran";
import type { ByMeaningDays } from "@alrisali/content/quran";

/** What a by-amount plan counts a session in. */
export const AMOUNT_UNITS = [
  "ayat",
  "pages",
  "quarters",
  "hizb",
  "juz",
  "surahs",
] as const;
export type AmountUnit = (typeof AMOUNT_UNITS)[number];

/**
 * The fewest and most of a unit one session may hold. Five ayat is the
 * floor, so the longest plan stays near 1250 sessions.
 */
export const AMOUNT_LIMITS: Record<AmountUnit, { min: number; max: number }> = {
  ayat: { min: 5, max: 1000 },
  pages: { min: 1, max: 604 },
  quarters: { min: 1, max: 240 },
  hizb: { min: 1, max: 60 },
  juz: { min: 1, max: 30 },
  surahs: { min: 1, max: 114 },
};

/** The days between sessions: every day, every other day, or every week. */
export const SESSION_INTERVALS = [1, 2, 7] as const;
export type SessionInterval = (typeof SESSION_INTERVALS)[number];

/**
 * Minutes to read a Quran Page, tartil at a moderate pace. A planning
 * estimate for "minutes per session", not a measurement of the reader.
 */
export const READING_MINUTES_PER_PAGE = 2;

/** An inclusive run of indexes into `AYAT`. */
export interface IndexRange {
  first: number;
  last: number;
}

const TOTAL_AYAT = AYAT.length;

/** Index in `AYAT` of the first ayah of each hizb quarter. */
export const QUARTER_STARTS: readonly number[] = HIZB_QUARTER_STARTS.map(
  (key) => AYAT.findIndex((ayah) => ayah.key === key)
);

const ayahIndex = (key: string): number => {
  const index = AYAT.findIndex((ayah) => ayah.key === key);
  if (index === -1) {
    throw new Error(`No ayah ${key}`);
  }
  return index;
};

/** The hizb quarter (from 0) of each ayah. */
const QUARTER_OF: readonly number[] = (() => {
  const quarters = Array.from<number>({ length: TOTAL_AYAT });
  let quarter = 0;
  for (let index = 0; index < TOTAL_AYAT; index += 1) {
    while (
      quarter + 1 < QUARTER_STARTS.length &&
      index >= (QUARTER_STARTS[quarter + 1] ?? TOTAL_AYAT)
    ) {
      quarter += 1;
    }
    quarters[index] = quarter;
  }
  return quarters;
})();

/** Where an ayah falls when counted in a unit, from 0. */
const ordinalIn = (unit: AmountUnit, index: number): number => {
  const ayah = AYAT[index];
  if (!ayah) {
    throw new RangeError(`No ayah at ${index}`);
  }
  switch (unit) {
    case "ayat": {
      return index;
    }
    case "pages": {
      return ayah.page - 1;
    }
    case "quarters": {
      return QUARTER_OF[index] ?? 0;
    }
    case "hizb": {
      return Math.floor((QUARTER_OF[index] ?? 0) / 4);
    }
    case "juz": {
      return ayah.juz - 1;
    }
    case "surahs": {
      return ayah.surah - 1;
    }
    default: {
      return index;
    }
  }
};

/** Runs of ayat that fall in the same group of `count` whole units. */
const groupedRanges = (unit: AmountUnit, count: number): IndexRange[] => {
  const ranges: IndexRange[] = [];
  let first = 0;
  let group = 0;
  for (let index = 0; index < TOTAL_AYAT; index += 1) {
    const current = Math.floor(ordinalIn(unit, index) / count);
    if (index > 0 && current !== group) {
      ranges.push({ first, last: index - 1 });
      first = index;
    }
    group = current;
  }
  ranges.push({ first, last: TOTAL_AYAT - 1 });
  return ranges;
};

/** `days` portions of whole hizb quarters, as even as 240 quarters allow. */
const evenRanges = (days: number): IndexRange[] => {
  const quarters = QUARTER_STARTS.length;
  return Array.from({ length: days }, (_, index) => {
    const firstQuarter = Math.floor((index * quarters) / days);
    const lastQuarter = Math.floor(((index + 1) * quarters) / days) - 1;
    return {
      first: QUARTER_STARTS[firstQuarter] ?? 0,
      last:
        lastQuarter === quarters - 1
          ? TOTAL_AYAT - 1
          : (QUARTER_STARTS[lastQuarter + 1] ?? TOTAL_AYAT) - 1,
    };
  });
};

const meaningIndexRanges = (days: ByMeaningDays): IndexRange[] =>
  byMeaningRanges(days).map(({ from, to }) => ({
    first: ayahIndex(from),
    last: ayahIndex(to),
  }));

/** The part of a Khatmah plan that decides its division (see khatmah.ts). */
export type DivisionPlan =
  | { kind: "suggested" }
  | { kind: "even"; days: number }
  | { kind: "meaning"; days: ByMeaningDays }
  | { kind: "amount"; unit: AmountUnit; count: number };

const rangesCache = new Map<string, readonly IndexRange[]>();

/**
 * Every session of a plan before any join, as ayat index ranges: contiguous
 * and covering all 6236 ayat exactly once.
 */
export const baseRanges = (plan: DivisionPlan): readonly IndexRange[] => {
  const key =
    plan.kind === "suggested"
      ? "even:30"
      : JSON.stringify([
          plan.kind,
          plan.kind === "even" ? plan.days : "",
          plan.kind === "meaning" ? plan.days : "",
          plan.kind === "amount" ? plan.unit : "",
          plan.kind === "amount" ? plan.count : "",
        ]);
  const cached = rangesCache.get(key);
  if (cached) {
    return cached;
  }
  let ranges: IndexRange[];
  switch (plan.kind) {
    case "suggested": {
      ranges = evenRanges(30);
      break;
    }
    case "even": {
      ranges = evenRanges(plan.days);
      break;
    }
    case "meaning": {
      ranges = meaningIndexRanges(plan.days);
      break;
    }
    case "amount": {
      ranges = groupedRanges(plan.unit, plan.count);
      break;
    }
    default: {
      ranges = evenRanges(30);
    }
  }
  rangesCache.set(key, ranges);
  return ranges;
};
