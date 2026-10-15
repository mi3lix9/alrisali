// Sound mode hears the Believer's Takbirs in speech transcripts. Every
// transition in a Salah is said aloud: a Takbir, except rising from Ruku,
// which is "Sami' Allahu liman hamidah" (the Tasmi'). Both count, so the
// steps stay in line with the Positions.

const DIACRITICS =
  /[\u0610-\u061A\u064B-\u065F\u0670\u06D6-\u06DC\u06DF-\u06E8\u06EA-\u06ED]/gu;
const TATWEEL = /\u0640/gu;
// Invisible direction and joining marks: iOS transcripts carry a
// right-to-left mark (U+200F) before words.
const INVISIBLE_MARKS =
  /[\u061C\u200B-\u200F\u202A-\u202E\u2066-\u2069\uFEFF]/gu;
const ALEF_FORMS = /[أإآٱ]/gu;

/**
 * "أكبر" on its own (the recogniser often loses "الله"), the Tasmi', and
 * their Latin transcriptions for a recogniser that falls back to them.
 */
const CUE = /اكبر|سمع ?الله|akh?bar|sami\S* allah/giu;

/** How many Takbirs (and Tasmi's) a transcript holds. */
export const countTakbirs = (transcript: string): number =>
  transcript
    .replaceAll(INVISIBLE_MARKS, "")
    .replaceAll(DIACRITICS, "")
    .replaceAll(TATWEEL, "")
    .replaceAll(ALEF_FORMS, "ا")
    .replaceAll(/\s+/gu, " ")
    .match(CUE)?.length ?? 0;

/**
 * A new utterance repeating a Takbir this soon after the last one is the
 * recogniser saying it again; no two transitions come this close.
 */
export const TAKBIR_REPEAT_MS = 700;

export interface TakbirDetector {
  /** Whether the opening Takbir has been heard (or the Salah is under way). */
  readonly opened: boolean;
  /**
   * Feeds one transcript, interim or final, and returns how many steps the
   * Believer moved on. Interim transcripts of one utterance grow, so only
   * Takbirs beyond those already counted in it are new; a final one ends
   * the utterance. The first Takbir of the Salah opens it and moves nothing.
   */
  feed: (transcript: string, isFinal: boolean, at: number) => number;
  /** The recogniser ended the utterance: the next transcript starts anew. */
  seal: () => void;
  /** The Salah is under way already (a tap moved it): no opening to wait for. */
  open: () => void;
}

export const createTakbirDetector = (): TakbirDetector => {
  let opened = false;
  let counted = 0;
  let lastAt = Number.NEGATIVE_INFINITY;

  const seal = () => {
    counted = 0;
  };

  return {
    get opened() {
      return opened;
    },
    feed: (transcript, isFinal, at) => {
      const heard = countTakbirs(transcript);
      let fresh = Math.max(0, heard - counted);
      if (fresh > 0 && counted === 0 && at - lastAt < TAKBIR_REPEAT_MS) {
        fresh -= 1;
      }
      if (fresh > 0) {
        lastAt = at;
      }
      counted = Math.max(counted, heard);
      if (isFinal) {
        seal();
      }
      if (fresh > 0 && !opened) {
        opened = true;
        fresh -= 1;
      }
      return fresh;
    },
    seal,
    open: () => {
      opened = true;
    },
  };
};
