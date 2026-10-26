import { HIZB_QUARTER_STARTS, SURAHS } from "@alrisali/content/quran";
import type { Surah } from "@alrisali/content/quran";

import { ayatOfSurah, findAyah, JUZ_COUNT } from "./mushaf";
import type { Ayah } from "./mushaf";

/** The Quran index's tabs, in order. */
export const INDEX_TABS = [
  "surahs",
  "juz",
  "page",
  "quarters",
  "saved",
] as const;
export type IndexTab = (typeof INDEX_TABS)[number];

/** What the Saved tab can filter to. */
export const SAVED_FILTERS = ["ribbons", "favorites", "notes"] as const;
export type SavedFilter = (typeof SAVED_FILTERS)[number];

/** How the Surahs tab can be ordered. */
export const SURAH_SORTS = [
  "number",
  "alphabet",
  "ayat",
  "revelation",
] as const;
export type SurahSort = (typeof SURAH_SORTS)[number];

/** Arabic names sort without the article, so الفاتحة files under ف. */
const withoutArticle = (nameAr: string): string =>
  nameAr.replace(/^ال(?=\S)/u, "");

/** Transliterated names sort without their "Al-", "An-" or "As-" article. */
const withoutEnglishArticle = (nameEn: string): string =>
  nameEn.replace(/^A[lnsdrtz]-/iu, "");

const byLanguage = (language: string, surah: Surah): string =>
  language === "ar"
    ? withoutArticle(surah.nameAr)
    : withoutEnglishArticle(surah.nameEn);

const byNumber = (a: Surah, b: Surah) => a.number - b.number;

/**
 * The 114 surahs in the chosen order: mushaf number, alphabet in the app
 * language, ayat count (most first) or revelation order. Ties fall back to
 * the mushaf number.
 */
export const sortSurahs = (sort: SurahSort, language: string): Surah[] => {
  const compare = {
    number: byNumber,
    alphabet: (a: Surah, b: Surah) =>
      byLanguage(language, a).localeCompare(
        byLanguage(language, b),
        language === "ar" ? "ar" : "en"
      ),
    ayat: (a: Surah, b: Surah) =>
      ayatOfSurah(b.number).length - ayatOfSurah(a.number).length,
    revelation: (a: Surah, b: Surah) => a.revelationOrder - b.revelationOrder,
  }[sort];
  return SURAHS.toSorted((a, b) => compare(a, b) || byNumber(a, b));
};

export interface HizbQuarter {
  /** 1 through 240 across the mushaf. */
  number: number;
  /** 1 through 60. */
  hizb: number;
  /** 0 for the hizb's start, then 1, 2 and 3 for its quarters. */
  quarter: 0 | 1 | 2 | 3;
  /** The ayah the quarter opens with. */
  ayah: Ayah;
}

/** The hizb quarters under the juz each opens in, juz 1 first. */
export const quartersByJuz = (): { juz: number; quarters: HizbQuarter[] }[] => {
  const groups = Array.from({ length: JUZ_COUNT }, (_, index) => ({
    juz: index + 1,
    quarters: [] as HizbQuarter[],
  }));
  for (const [index, key] of HIZB_QUARTER_STARTS.entries()) {
    const ayah = findAyah(key);
    if (ayah) {
      groups[ayah.juz - 1]?.quarters.push({
        number: index + 1,
        hizb: Math.floor(index / 4) + 1,
        quarter: (index % 4) as 0 | 1 | 2 | 3,
        ayah,
      });
    }
  }
  return groups;
};
