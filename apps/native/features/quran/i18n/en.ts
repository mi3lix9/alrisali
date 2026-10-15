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
};
