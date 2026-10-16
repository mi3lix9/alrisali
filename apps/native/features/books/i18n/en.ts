import type { Catalog } from "@alrisali/i18n";

import type { ar } from "./ar";

export const en: Catalog<typeof ar> = {
  books: "Books",
  notFound: "This text could not be found.",
  search: {
    title: "Supplications",
    indexing: "Searching the supplication texts…",
    more: "Showing {{shown}} of {{total}}",
  },
  reader: {
    view: {
      recite: "Recite-Along",
    },
    language: {
      label: "Text language",
      ar: "العربية",
      en: "English",
      both: "Both",
    },
    fontSize: {
      smaller: "Smaller text",
      larger: "Larger text",
    },
    loading: "Opening the text…",
    loadError: "The text could not be opened.",
    section: "Section {{number}}",
    toolbar: {
      label: "Reading tools",
      format: "Format",
    },
    format: {
      title: "Reading format",
      summary: "{{font}} · {{size}} · {{theme}}",
      font: {
        label: "Font",
        sample: "بسم",
        amiri: "Amiri",
        system: "Device font",
        plex: "Plex",
      },
      size: "Size",
      spacing: {
        label: "Line spacing",
        compact: "Compact",
        normal: "Normal",
        wide: "Wide",
      },
      theme: {
        label: "Theme",
        sample: "ع",
        light: "Light",
        dark: "Dark",
        system: "System",
        sepia: "Sepia",
      },
      reset: "Reset",
      resetDone: "The format is back to its defaults",
      done: "Done",
    },
    resume: {
      offer: "Continue at section {{section}} of {{total}}",
      go: "Go there",
      resumed: "Continued at section {{section}}, where you stopped.",
      restart: "Start from the beginning",
    },
  },
  taqibat: "Taqibat",
  amal: {
    title: "A'mal of the months",
    entry: "A'mal of the Hijri months",
    entryDescription: "The acts of each Hijri month, day by day",
    months: "Hijri months",
    current: "{{month}} · now",
    tabs: {
      label: "Kind of a'mal",
      specific: "Specific · by day",
      general: "General · every day",
    },
    wholeMonth: "Every day of the month",
    wholeMonthCount_zero: "No general a'mal",
    wholeMonthCount_one: "{{count}} general act",
    wholeMonthCount_two: "{{count}} general acts",
    wholeMonthCount_few: "{{count}} general acts",
    wholeMonthCount_many: "{{count}} general acts",
    wholeMonthCount_other: "{{count}} general acts",
    generalHint: "Done on any day of the month",
    today: "Today",
    kinds: {
      dua: "Dua",
      ziyarah: "Ziyarah",
      prayer: "Prayer",
      fast: "Fast",
      tasbih: "Tasbih",
    },
    times: {
      night: "The night before",
      day: "During the day",
    },
    emptyMonth: "No a'mal are listed for this month yet.",
    emptyGeneral: "No general a'mal are listed for this month yet.",
  },
  continue: {
    label: "Continue the supplication",
  },
};
