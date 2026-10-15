import type { Catalog } from "@alrisali/i18n";

import type { ar } from "./ar";

export const en: Catalog<typeof ar> = {
  title: "The Holy Quran",
  library: {
    description:
      "The Madinah mushaf, Hafs reading, 604 pages, available offline.",
    open: "Open the mushaf",
  },
  page: {
    label: "Page {{page}}",
    juz: "Juz {{juz}}",
    hizb: "Hizb {{hizb}}",
    quarter: "¼",
    half: "½",
    threeQuarters: "¾",
    surah: "Start of {{name}}",
  },
  surah: {
    end: "End of Surah {{name}}",
    next: "Next Surah: {{number}}. {{name}}",
    completed: "You have completed the Quran",
  },
  chrome: {
    label: "Reader controls",
    back: "Back",
    settings: "Reading settings",
    position: "Juz {{juz}} · Page {{page}}",
    surahNumber: "Surah {{number}}",
  },
  hint: {
    tap: "Tap to show the controls",
    longPress: "Long-press an ayah for its options",
  },
  sheet: {
    title: "{{surah}} · Ayah {{ayah}}",
    copyHint: "Long-press the text to copy it.",
    share: "Share",
  },
  settings: {
    title: "Quran reading",
    mode: {
      title: "Reading mode",
      page: "Mushaf pages",
      surah: "Continuous Surah",
    },
    pageNav: {
      title: "Page turning",
      horizontal: "Horizontal",
      vertical: "Vertical",
    },
    fontSize: {
      title: "Surah Mode text size",
      smaller: "Smaller text",
      larger: "Larger text",
    },
  },
  navigation: {
    index: "Surah & Juz index",
    search: "Search the Quran",
    surahs: "Surahs",
    juz: "Juz",
    juzTitle: "Juz {{juz}}",
    current: "Current",
    surahMeta: "{{ayat}} ayat · p. {{page}}",
    juzMeta: "{{name}} · p. {{page}}",
    pageJump: "Go to page",
    pageNumber: "Page number (1–604)",
    pageInvalid: "Enter a number from 1 to 604",
    pagePreview: "Surah {{name}} · Juz {{juz}}",
    open: "Open",
    searchPlaceholder: "A Surah name or words from an ayah",
    searchHint:
      "No need to type diacritics. Type an ayah number such as 2:255 to open it.",
    noResults: "No results. Try a Surah name or another word.",
    ayat: "Ayat",
    moreAyat:
      "Showing the first {{shown}} of {{total}} ayat; add words to narrow it down.",
    ayahRef: "{{name}} · {{ayah}}",
    returnTo: "Back to page {{page}}",
    noReturn: "No previous position",
    scrubPage: "Go to page",
    scrubSurah: "Go to Surah",
    scrubPageValue: "Page {{page}} · {{name}}",
    scrubSurahValue: "{{number}} · {{name}}",
    bar: "Mushaf navigation",
  },
};
