import { AYAT, SURAHS } from "@alrisali/content/quran";
import type { Surah } from "@alrisali/content/quran";

import { findAyah, toWesternDigits } from "./mushaf";
import type { Ayah } from "./mushaf";

// Search over Surah names and ayah text that does not ask the Believer to type
// diacritics. Both sides are reduced to bare letters before comparing.

/** Harakat, Quranic annotation marks, the ayah-end sign, digits, tatweel. */
const MARKS =
  /[\u064B-\u065F\u0670\u06D6-\u06ED\u08F0-\u08FF\u0660-\u0669\u0640]/gu;
const DAGGER_ALIF = /\u0670/gu;
const ALIF_FORMS = /[\u0622\u0623\u0625\u0671]/gu;
const ALIF = /\u0627/gu;
const SPACES = /\s+/gu;

/**
 * Arabic as bare letters: no diacritics or Quranic marks, one alif for its
 * hamza and wasla forms, ى as ي and ة as ه, single spaces.
 */
export const normalizeArabic = (text: string): string =>
  text
    .replaceAll(MARKS, "")
    .replaceAll(ALIF_FORMS, "\u0627")
    .replaceAll("\u0649", "\u064A")
    .replaceAll("\u0629", "\u0647")
    .replaceAll(SPACES, " ")
    .trim();

/** Latin as lowercase letters and digits: "Al-Fātiḥah" is "alfatihah". */
const normalizeLatin = (text: string): string =>
  text
    .normalize("NFD")
    .toLowerCase()
    .replaceAll(/[^a-z0-9]/gu, "");

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
    const plain = normalizeArabic(ayah.text);
    return {
      ayah,
      plain,
      full: normalizeArabic(ayah.text.replaceAll(DAGGER_ALIF, "\u0627")),
      skeleton: plain.replaceAll(ALIF, ""),
    };
  });
  return ayahIndex;
};

const surahIndex = SURAHS.map((surah) => ({
  surah,
  arabic: normalizeArabic(surah.nameAr),
  latin: normalizeLatin(surah.nameEn),
}));

const AYAH_REFERENCE = /^(?<surah>\d+)\s*[:.]\s*(?<ayah>\d+)$/u;
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
  const trimmed = toWesternDigits(query.trim());
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

  if (/^\d+$/u.test(trimmed)) {
    const surah = SURAHS[Number(trimmed) - 1];
    return surah ? { surahs: [surah], ayat: [], ayatTotal: 0 } : NOTHING;
  }

  const arabic = normalizeArabic(trimmed);
  const latin = normalizeLatin(trimmed);
  const surahs = surahIndex
    .filter(
      (entry) =>
        (arabic && entry.arabic.includes(arabic)) ||
        (latin && entry.latin.includes(latin))
    )
    .map((entry) => entry.surah);

  if (arabic.length < MIN_AYAH_QUERY) {
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
