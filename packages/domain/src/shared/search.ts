// Text compared for search and matching, so the Believer never has to type
// diacritics or pick the right letter form: both sides are reduced to bare
// letters before comparing.

/** Harakat, Quranic annotation marks and the small (dagger) alif. */
const ARABIC_MARKS =
  /[\u0610-\u061A\u064B-\u065F\u0670\u06D6-\u06ED\u08F0-\u08FF]/gu;
const TATWEEL = /\u0640/gu;
// Invisible direction and joining marks. iOS speech transcripts begin with a
// right-to-left mark (U+200F).
const INVISIBLE_MARKS = /[\u061C\u200B-\u200F\u202A-\u202E\u2066-\u2069]/gu;
const ALEF_FORMS = /[\u0622\u0623\u0625\u0671]/gu;
const WHITESPACE = /\s+/gu;

/** Latin accents, once letters are decomposed (NFD). */
const LATIN_ACCENTS = /[\u0300-\u036F]/gu;
/** Marks inside transliterated words: "Du'a" is "dua". */
const APOSTROPHES = /['`\u2018\u2019\u02BC\u02BE\u02BF]/gu;
const PUNCTUATION = /[\p{P}\p{S}]/gu;

/**
 * Arabic as bare letters: no diacritics, Quranic marks or tatweel; one alef
 * for its hamza, madda and wasla forms; ى as ي, ة as ه, ؤ as و, ئ as ي;
 * single spaces.
 */
export const normalizeArabic = (text: string): string =>
  text
    .replaceAll(INVISIBLE_MARKS, "")
    .replaceAll(ARABIC_MARKS, "")
    .replaceAll(TATWEEL, "")
    .replaceAll(ALEF_FORMS, "\u0627")
    .replaceAll("\u0649", "\u064A")
    .replaceAll("\u0629", "\u0647")
    .replaceAll("\u0624", "\u0648")
    .replaceAll("\u0626", "\u064A")
    .replaceAll(WHITESPACE, " ")
    .trim();

/**
 * Any text, Arabic or English, as it is compared in a search: Arabic as bare
 * letters, Latin lowercase without accents, punctuation as spaces.
 */
export const normalizeSearchText = (text: string): string =>
  normalizeArabic(
    text
      .normalize("NFD")
      .replaceAll(LATIN_ACCENTS, "")
      .replaceAll(APOSTROPHES, "")
      .replaceAll(PUNCTUATION, " ")
      .toLowerCase()
  );

/**
 * Whether `text` contains `query`, ignoring diacritics, letter forms, case and
 * punctuation. A query with nothing left to search for matches nothing.
 */
export const matchesSearch = (text: string, query: string): boolean => {
  const needle = normalizeSearchText(query);
  return needle !== "" && normalizeSearchText(text).includes(needle);
};
