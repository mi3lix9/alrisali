import { PAGE_COUNT, SURAH_COUNT } from "./mushaf";
import type { JumpTarget, QuranReaderState, ReaderMode } from "./reader";

// The bottom bar's scrubber: it runs over the 604 pages in Page Mode and the
// 114 surahs in Surah Mode. Releasing it is a jump.

export interface ScrubberDomain {
  min: number;
  max: number;
}

export const scrubberDomain = (mode: ReaderMode): ScrubberDomain => ({
  min: 1,
  max: mode === "page" ? PAGE_COUNT : SURAH_COUNT,
});

/** Where the scrubber sits: the current page, or the current surah. */
export const scrubberValue = (state: QuranReaderState): number =>
  state.mode === "page" ? state.currentPage : state.currentSurah;

/** The jump for a scrubber value, rounded and kept within its domain. */
export const scrubberTarget = (mode: ReaderMode, value: number): JumpTarget => {
  const { min, max } = scrubberDomain(mode);
  const step = Math.min(max, Math.max(min, Math.round(value)));
  return mode === "page" ? { page: step } : { surah: step };
};
