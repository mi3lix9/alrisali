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
      label: "View",
      read: "Read",
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
};
