// Follows a live speech transcript through a text's words. Forgiving by
// design: diacritics are normalised away, small recognition slips are
// tolerated, and a window of upcoming words lets it skip a missed word so it
// never gets stuck. It only moves forward unless explicitly sought back.

import { normalizeArabic } from "./normalize";

/** How many upcoming words a heard word may match (skip tolerance). */
const LOOKAHEAD = 8;

/** Prefixes speech recognisers fuse onto the next word, longest first. */
const FUSED_PREFIXES = ["ال", "و", "ف", "ب", "ل", "ك", "س"];

/** Words this short may be glued onto the next by the recogniser. */
const GLUABLE_LENGTH = 2;

/** Shortest words that tolerate a clipped ending or one edit. */
const CLIPPED_MIN_LENGTH = 3;
const MAX_CLIPPED_CHARS = 2;
const ONE_EDIT_MIN_LENGTH = 4;

/** Whether `a` and `b` differ by at most one insertion, deletion or swap. */
const withinOneEdit = (a: string, b: string): boolean => {
  if (Math.abs(a.length - b.length) > 1) {
    return false;
  }
  let i = 0;
  let j = 0;
  let edits = 0;
  while (i < a.length && j < b.length) {
    if (a[i] !== b[j]) {
      edits += 1;
      if (edits > 1) {
        return false;
      }
      if (a.length >= b.length) {
        i += 1;
      }
      if (b.length >= a.length) {
        j += 1;
      }
      continue;
    }
    i += 1;
    j += 1;
  }
  return edits + (a.length - i) + (b.length - j) <= 1;
};

/** The heard word without a fused prefix, or unchanged when it has none. */
const stripFusedPrefix = (heard: string): string => {
  const prefix = FUSED_PREFIXES.find(
    (candidate) =>
      heard.startsWith(candidate) && heard.length > candidate.length + 1
  );
  return prefix ? heard.slice(prefix.length) : heard;
};

/** Fuzzy equality between a normalised text word and a heard word. */
export const wordsMatch = (target: string, heard: string): boolean => {
  if (!target || !heard) {
    return false;
  }
  if (target === heard) {
    return true;
  }
  const stem = stripFusedPrefix(heard);
  if (stem !== heard && wordsMatch(target, stem)) {
    return true;
  }
  const shorter = Math.min(target.length, heard.length);
  const clipped =
    shorter >= CLIPPED_MIN_LENGTH &&
    Math.abs(target.length - heard.length) <= MAX_CLIPPED_CHARS &&
    (target.startsWith(heard) || heard.startsWith(target));
  return (
    clipped || (shorter >= ONE_EDIT_MIN_LENGTH && withinOneEdit(target, heard))
  );
};

export interface ReciteMatcher {
  /** How many words have been recited. */
  readonly position: number;
  /**
   * Feeds one transcript, interim or final, and returns the position.
   * Interim transcripts of one utterance grow, so each is matched from the
   * position the utterance started at; a final one seals that position.
   */
  feed: (transcript: string, isFinal: boolean) => number;
  /** Starts a new utterance from the current position. */
  seal: () => void;
  /** Moves to a position: a touch advance, or 0 to start over. */
  seek: (position: number) => void;
}

/** A matcher over a text's normalised words (from `tokenizeText`). */
export const createReciteMatcher = (
  words: readonly string[]
): ReciteMatcher => {
  let anchor = 0;
  let position = 0;

  /** Where the heard word lands, from `from`, or `from` when nothing matches. */
  const advance = (from: number, heard: string): number => {
    const end = Math.min(words.length, from + LOOKAHEAD);
    for (let index = from; index < end; index += 1) {
      const word = words[index] ?? "";
      if (wordsMatch(word, heard)) {
        return index + 1;
      }
      const next = words[index + 1];
      if (
        next !== undefined &&
        word.length <= GLUABLE_LENGTH &&
        wordsMatch(word + next, heard)
      ) {
        return index + 2;
      }
    }
    return from;
  };

  return {
    get position() {
      return position;
    },
    feed: (transcript, isFinal) => {
      let reached = anchor;
      for (const heard of normalizeArabic(transcript).split(" ")) {
        if (reached >= words.length) {
          break;
        }
        reached = advance(reached, heard);
      }
      position = Math.max(position, reached);
      if (isFinal) {
        anchor = position;
      }
      return position;
    },
    seal: () => {
      anchor = position;
    },
    seek: (target) => {
      position = Math.max(0, Math.min(words.length, target));
      anchor = position;
    },
  };
};
