import { z } from "zod";

import {
  ayatOfSurah,
  findAyah,
  firstAyahOfPage,
  firstPageOfSurah,
  isPage,
  isSurah,
  PAGE_COUNT,
  SURAH_COUNT,
} from "./mushaf";
import type { AyahKey } from "./mushaf";

// The Quran reader's position and how it moves. The UI renders the state and
// forwards what the Believer did as actions.

export const READER_MODES = ["page", "surah"] as const;
export type ReaderMode = (typeof READER_MODES)[number];

/** How Page Mode turns pages: a right-to-left pager, or a vertical scroll. */
export const PAGE_NAVS = ["horizontal", "vertical"] as const;
export type PageNav = (typeof PAGE_NAVS)[number];

/** Surah Mode text sizes, in points. */
export const SURAH_FONT_SIZE = { min: 18, max: 44, step: 2 } as const;

export const quranReaderSettingsSchema = z.object({
  mode: z.enum(READER_MODES),
  pageNav: z.enum(PAGE_NAVS),
  surahFontSize: z
    .number()
    .int()
    .min(SURAH_FONT_SIZE.min)
    .max(SURAH_FONT_SIZE.max),
  /** The Quran Foundation recitation the reader and Verse of the Day play. */
  reciterId: z.number().int().positive(),
});

/** How the Believer likes to read; kept in their database. */
export type QuranReaderSettings = z.infer<typeof quranReaderSettingsSchema>;

export const DEFAULT_QURAN_READER_SETTINGS: QuranReaderSettings = {
  mode: "page",
  pageNav: "horizontal",
  surahFontSize: 26,
  /** Mishari Rashid al-Afasy (Murattal). */
  reciterId: 7,
};

export interface QuranReaderState {
  mode: ReaderMode;
  pageNav: PageNav;
  /** 1–604. */
  currentPage: number;
  /** 1–114. */
  currentSurah: number;
  lastReadAyah: AyahKey | null;
}

export type ReaderAction =
  /** Paging or scrolling brought a page into view (Page Mode). */
  | { type: "page-shown"; page: number }
  | { type: "next-page" }
  | { type: "previous-page" }
  /** Scrolling brought an ayah to the top of the view (Surah Mode). */
  | { type: "ayah-shown"; ayah: AyahKey }
  | { type: "next-surah" }
  | { type: "previous-surah" }
  | { type: "switch-mode"; mode: ReaderMode }
  | { type: "set-page-nav"; pageNav: PageNav };

const clamp = (value: number, min: number, max: number): number =>
  Math.min(max, Math.max(min, value));

/** The state for a page: Page Mode reads it from its first ayah. */
const atPage = (state: QuranReaderState, page: number): QuranReaderState => {
  const target = clamp(page, 1, PAGE_COUNT);
  if (target === state.currentPage) {
    return state;
  }
  const first = firstAyahOfPage(target);
  return {
    ...state,
    currentPage: target,
    currentSurah: first.surah,
    lastReadAyah: first.key,
  };
};

/** The state for a surah: Surah Mode opens it at its first ayah. */
const atSurah = (state: QuranReaderState, surah: number): QuranReaderState => {
  const target = clamp(surah, 1, SURAH_COUNT);
  if (target === state.currentSurah) {
    return state;
  }
  const [first] = ayatOfSurah(target);
  return {
    ...state,
    currentSurah: target,
    currentPage: firstPageOfSurah(target),
    lastReadAyah: first?.key ?? state.lastReadAyah,
  };
};

/**
 * The ayah a mode switch keeps the Believer at: the Last-Read Ayah when it is
 * on screen, otherwise the start of what is on screen.
 */
const anchorAyah = (state: QuranReaderState) => {
  const lastRead = state.lastReadAyah
    ? findAyah(state.lastReadAyah)
    : undefined;
  if (state.mode === "page") {
    return lastRead?.page === state.currentPage
      ? lastRead
      : firstAyahOfPage(state.currentPage);
  }
  return lastRead?.surah === state.currentSurah
    ? lastRead
    : ayatOfSurah(state.currentSurah)[0];
};

export const readerReducer = (
  state: QuranReaderState,
  action: ReaderAction
): QuranReaderState => {
  switch (action.type) {
    case "page-shown": {
      return isPage(action.page) ? atPage(state, action.page) : state;
    }
    case "next-page": {
      return atPage(state, state.currentPage + 1);
    }
    case "previous-page": {
      return atPage(state, state.currentPage - 1);
    }
    case "ayah-shown": {
      const ayah = findAyah(action.ayah);
      return ayah
        ? {
            ...state,
            currentSurah: ayah.surah,
            currentPage: ayah.page,
            lastReadAyah: ayah.key,
          }
        : state;
    }
    case "next-surah": {
      return atSurah(state, state.currentSurah + 1);
    }
    case "previous-surah": {
      return atSurah(state, state.currentSurah - 1);
    }
    case "switch-mode": {
      if (action.mode === state.mode) {
        return state;
      }
      const anchor = anchorAyah(state);
      return anchor
        ? {
            ...state,
            mode: action.mode,
            currentPage: anchor.page,
            currentSurah: anchor.surah,
            lastReadAyah: anchor.key,
          }
        : { ...state, mode: action.mode };
    }
    case "set-page-nav": {
      return { ...state, pageNav: action.pageNav };
    }
    default: {
      return state;
    }
  }
};

export interface OpenReaderOptions {
  settings: QuranReaderSettings;
  /**
   * Open at this ayah (`surah:ayah`): its page in Page Mode, its surah in
   * Surah Mode. Anything that names no ayah, such as a bad link, is ignored.
   */
  ayah?: string | null;
  /** Open at this page (Page Mode), when no ayah is given. */
  page?: number;
  /** Open at this surah (Surah Mode), when no ayah is given. */
  surah?: number;
  lastReadAyah?: AyahKey | null;
}

/** The reader as it opens; out-of-range targets fall back to the start. */
export const openReader = ({
  settings,
  ayah,
  page,
  surah,
  lastReadAyah = null,
}: OpenReaderOptions): QuranReaderState => {
  const known = ayah ? findAyah(ayah) : undefined;
  const target =
    known ??
    (page !== undefined && isPage(page) ? firstAyahOfPage(page) : undefined) ??
    (surah !== undefined && isSurah(surah) ? ayatOfSurah(surah)[0] : undefined);
  return {
    mode: settings.mode,
    pageNav: settings.pageNav,
    currentPage: target?.page ?? 1,
    currentSurah: target?.surah ?? 1,
    lastReadAyah: known?.key ?? lastReadAyah,
  };
};

/**
 * The end of a surah in Surah Mode: it offers the next surah and never moves
 * on by itself. The last surah offers none.
 */
export const surahEnd = (surah: number): { nextSurah: number | null } => ({
  nextSurah: surah < SURAH_COUNT ? surah + 1 : null,
});
