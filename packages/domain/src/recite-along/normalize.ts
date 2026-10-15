// Normalisation makes speech transcripts (undiacritised, unified letter forms)
// comparable to a fully vocalised Supplication.

import { normalizeSearchText } from "../shared";

const WHITESPACE = /\s+/gu;
const ARABIC_LETTER = /[\u0621-\u064A]/u;

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
      const normalized = normalizeSearchText(raw);
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
