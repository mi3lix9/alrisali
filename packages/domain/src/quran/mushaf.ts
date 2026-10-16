import {
  AYAT,
  HIZB_QUARTER_STARTS,
  PAGE_COUNT,
  SURAH_COUNT,
} from "@alrisali/content/quran";
import type { Ayah } from "@alrisali/content/quran";

import { readNumber } from "../shared/digits";

// Lookups over the bundled KFGQPC mushaf: which page holds an ayah, which
// ayat a page holds, and where a page sits in the juz and hizb.

export { PAGE_COUNT, SURAH_COUNT } from "@alrisali/content/quran";
export type { Ayah, AyahKey } from "@alrisali/content/quran";

const ayahByKey = new Map<string, Ayah>(AYAT.map((ayah) => [ayah.key, ayah]));
const ayahIndex = new Map<string, number>(
  AYAT.map((ayah, index) => [ayah.key, index])
);
const quarterStartIndex = HIZB_QUARTER_STARTS.map(
  (key) => ayahIndex.get(key) ?? 0
);

/** Every ayah of each page, page 1 first. */
const ayatByPage: Ayah[][] = Array.from({ length: PAGE_COUNT }, () => []);
/** Every ayah of each surah, surah 1 first. */
const ayatBySurah: Ayah[][] = Array.from({ length: SURAH_COUNT }, () => []);
/** The first ayah of each juz as KFGQPC divides them, juz 1 first. */
const juzStarts: Ayah[] = [];
for (const ayah of AYAT) {
  ayatByPage[ayah.page - 1]?.push(ayah);
  ayatBySurah[ayah.surah - 1]?.push(ayah);
  juzStarts[ayah.juz - 1] ??= ayah;
}

export const JUZ_COUNT = 30;

export const isPage = (page: number): boolean =>
  Number.isInteger(page) && page >= 1 && page <= PAGE_COUNT;

export const isSurah = (surah: number): boolean =>
  Number.isInteger(surah) && surah >= 1 && surah <= SURAH_COUNT;

/** The ayah a key names, or undefined when the Quran has no such ayah. */
export const findAyah = (key: string): Ayah | undefined => ayahByKey.get(key);

/** The ayah's place in the whole Quran, 1:1 → 1 through 114:6 → 6236; undefined when there is no such ayah. */
export const ayahNumber = (key: string): number | undefined => {
  const index = ayahIndex.get(key);
  return index === undefined ? undefined : index + 1;
};

/** The ayah a juz opens with, as KFGQPC divides the juz. */
export const firstAyahOfJuz = (juz: number): Ayah => {
  const first = juzStarts[juz - 1];
  if (!(Number.isInteger(juz) && first)) {
    throw new RangeError(`No Juz ${juz}; juz run 1–${JUZ_COUNT}`);
  }
  return first;
};

/** The ayat printed on a page, in order. */
export const ayatOnPage = (page: number): readonly Ayah[] => {
  const ayat = ayatByPage[page - 1];
  if (!ayat) {
    throw new RangeError(`No Quran Page ${page}; pages run 1–${PAGE_COUNT}`);
  }
  return ayat;
};

/** The ayat of a surah, in order. */
export const ayatOfSurah = (surah: number): readonly Ayah[] => {
  const ayat = ayatBySurah[surah - 1];
  if (!ayat) {
    throw new RangeError(`No Surah ${surah}; surahs run 1–${SURAH_COUNT}`);
  }
  return ayat;
};

/** The first ayah printed on a page: the page's reading position. */
export const firstAyahOfPage = (page: number): Ayah => {
  const [first] = ayatOnPage(page);
  if (!first) {
    throw new RangeError(`Quran Page ${page} holds no ayah`);
  }
  return first;
};

/** The page a surah begins on. */
export const firstPageOfSurah = (surah: number): number => {
  const [first] = ayatOfSurah(surah);
  if (!first) {
    throw new RangeError(`Surah ${surah} holds no ayah`);
  }
  return first.page;
};

export interface PagePosition {
  page: number;
  /** The surah of the page's first ayah. */
  surah: number;
  /** The juz KFGQPC gives the page's first ayah. */
  juz: number;
  /** 1–60. */
  hizb: number;
  /** Quarters of the hizb read before the page's first ayah: 0–3. */
  quarter: number;
}

/** Where a page sits: its surah, juz, and the hizb quarter it opens in. */
export const pagePosition = (page: number): PagePosition => {
  const first = firstAyahOfPage(page);
  const index = ayahIndex.get(first.key) ?? 0;
  // The first quarter starts at 1:1, so some quarter always holds the ayah.
  const quarterIndex = quarterStartIndex.findLastIndex(
    (start) => start <= index
  );
  const quartersPerHizb = 4;
  return {
    page,
    surah: first.surah,
    juz: first.juz,
    hizb: Math.floor(quarterIndex / quartersPerHizb) + 1,
    quarter: quarterIndex % quartersPerHizb,
  };
};

/**
 * The page a typed number names, in Western or Arabic-Indic digits, or null
 * when it names none.
 */
export const parsePage = (text: string): number | null => {
  const page = readNumber(text);
  return page !== null && isPage(page) ? page : null;
};
