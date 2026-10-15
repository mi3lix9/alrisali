// Normalisation makes speech transcripts (undiacritised, unified letter forms)
// comparable to a fully vocalised Supplication.

const DIACRITICS =
  /[\u0610-\u061A\u064B-\u065F\u0670\u06D6-\u06DC\u06DF-\u06E8\u06EA-\u06ED]/gu;
const TATWEEL = /\u0640/gu;
// Invisible direction and joining marks. iOS speech transcripts begin with a
// right-to-left mark (U+200F).
const INVISIBLE_MARKS = /[\u061C\u200B-\u200F\u202A-\u202E\u2066-\u2069]/gu;
// Punctuation that may be glued to words in the source text.
const PUNCTUATION = /[.,;:!?،؛؟()[\]{}«»"'\-–—…٭*]/gu;
const WHITESPACE = /\s+/gu;
const ARABIC_LETTER = /[\u0621-\u064A]/u;

/** Normalises Arabic for matching: strips diacritics, unifies letter forms. */
export const normalizeArabic = (text: string): string =>
  text
    .replaceAll(INVISIBLE_MARKS, "")
    .replaceAll(DIACRITICS, "")
    .replaceAll(TATWEEL, "")
    .replaceAll(PUNCTUATION, " ")
    .replaceAll(/[أإآٱ]/gu, "ا")
    .replaceAll("ة", "ه")
    .replaceAll("ى", "ي")
    .replaceAll("ؤ", "و")
    .replaceAll("ئ", "ي")
    .replaceAll(WHITESPACE, " ")
    .trim();

export interface ReciteToken {
  /** The token as written, with its diacritics. */
  text: string;
  /** Its index among the matchable words, or null for digits and punctuation. */
  wordIndex: number | null;
  /** How many matchable words come before it. */
  wordsBefore: number;
}

export interface TokenizedText {
  /** Lines of tokens; an empty line is a paragraph gap. */
  lines: ReciteToken[][];
  /** The normalised matchable words, in order. */
  words: string[];
}

/**
 * Splits a text into tokens to show, keeping its lines, and the parallel list
 * of normalised words to match. A token without an Arabic letter is shown but
 * never matched.
 */
export const tokenizeText = (text: string): TokenizedText => {
  const lines: ReciteToken[][] = [];
  const words: string[] = [];
  for (const rawLine of text.split("\n")) {
    const line: ReciteToken[] = [];
    for (const raw of rawLine.split(WHITESPACE)) {
      if (!raw) {
        continue;
      }
      const normalized = normalizeArabic(raw);
      const matchable = ARABIC_LETTER.test(normalized);
      line.push({
        text: raw,
        wordIndex: matchable ? words.length : null,
        wordsBefore: words.length,
      });
      if (matchable) {
        words.push(normalized);
      }
    }
    lines.push(line);
  }
  return { lines, words };
};
