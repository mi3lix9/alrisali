import { AYAT, SURAHS } from "@alrisali/content/quran";
import type { Surah } from "@alrisali/content/quran";

import { writeDigits } from "../shared/digits";
import { findAyah } from "./mushaf";
import type { Ayah } from "./mushaf";
import { bareQuranText, findSurahsByName } from "./query";

// Search over Surah names and ayah text that does not ask the Believer to type
// diacritics. Both sides are reduced to bare letters before comparing.

const DAGGER_ALIF = /\u0670/gu;
const ALIF = /\u0627/gu;

interface AyahIndexEntry {
  ayah: Ayah;
  /** The small (dagger) alif dropped: ٱلرَّحۡمَٰنِ reads الرحمن. */
  plain: string;
  /** The small alif written out: مَٰلِكِ reads مالك. */
  full: string;
  /** No alif at all, so either spelling of a word matches. */
  skeleton: string;
}

let ayahIndex: AyahIndexEntry[] | undefined;
const getAyahIndex = (): AyahIndexEntry[] => {
  ayahIndex ??= AYAT.map((ayah) => {
    const plain = bareQuranText(ayah.text);
    return {
      ayah,
      plain,
      full: bareQuranText(ayah.text.replaceAll(DAGGER_ALIF, "\u0627")),
      skeleton: plain.replaceAll(ALIF, ""),
    };
  });
  return ayahIndex;
};

const AYAH_REFERENCE = /^(?<surah>\d+)\s*[:.]\s*(?<ayah>\d+)$/u;
const SURAH_NUMBER = /^\d+$/u;
const MIN_AYAH_QUERY = 2;

export interface QuranSearchResult {
  surahs: Surah[];
  /** Matching ayat, best matches first, at most `limit` of them. */
  ayat: Ayah[];
  /** Every matching ayah, beyond the ones listed. */
  ayatTotal: number;
}

export interface QuranSearchOptions {
  /** How many ayat to list; 50 by default. */
  limit?: number;
}

const NOTHING: QuranSearchResult = { surahs: [], ayat: [], ayatTotal: 0 };

const matchingSurahs = (trimmed: string): Surah[] => {
  if (SURAH_NUMBER.test(trimmed)) {
    const surah = SURAHS[Number(trimmed) - 1];
    return surah ? [surah] : [];
  }
  return findSurahsByName(trimmed);
};

/**
 * Surahs by Arabic or English name, without diacritics, or by number. Names
 * only: cheap enough to run on every keystroke.
 */
export const searchSurahs = (query: string): Surah[] => {
  const trimmed = writeDigits(query.trim(), "latin");
  return trimmed ? matchingSurahs(trimmed) : [];
};

/**
 * Surahs by Arabic or English name or number, and ayat by their text, all
 * without diacritics; "2:255" opens that ayah. Ayat that match as typed come
 * first in mushaf order, then those that match only with the alifs set aside
 * (the Uthmani script writes some of them small or not at all).
 */
export const searchQuran = (
  query: string,
  { limit = 50 }: QuranSearchOptions = {}
): QuranSearchResult => {
  const trimmed = writeDigits(query.trim(), "latin");
  if (!trimmed) {
    return NOTHING;
  }

  const reference = AYAH_REFERENCE.exec(trimmed);
  if (reference) {
    const ayah = findAyah(
      `${reference.groups?.surah}:${reference.groups?.ayah}`
    );
    return ayah ? { surahs: [], ayat: [ayah], ayatTotal: 1 } : NOTHING;
  }

  const surahs = matchingSurahs(trimmed);
  const arabic = bareQuranText(trimmed);
  if (SURAH_NUMBER.test(trimmed) || arabic.length < MIN_AYAH_QUERY) {
    return { surahs, ayat: [], ayatTotal: 0 };
  }
  const skeleton = arabic.replaceAll(ALIF, "");
  const exact: Ayah[] = [];
  const loose: Ayah[] = [];
  for (const entry of getAyahIndex()) {
    if (entry.plain.includes(arabic) || entry.full.includes(arabic)) {
      exact.push(entry.ayah);
    } else if (skeleton && entry.skeleton.includes(skeleton)) {
      loose.push(entry.ayah);
    }
  }
  return {
    surahs,
    ayat: [...exact, ...loose].slice(0, limit),
    ayatTotal: exact.length + loose.length,
  };
};
