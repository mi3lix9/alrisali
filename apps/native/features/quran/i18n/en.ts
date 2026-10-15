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
  },
};
