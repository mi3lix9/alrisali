import type { Catalog } from "@alrisali/i18n";

import type { ar } from "./ar";

export const en: Catalog<typeof ar> = {
  books: "Books",
  notFound: "This text could not be found.",
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
};
