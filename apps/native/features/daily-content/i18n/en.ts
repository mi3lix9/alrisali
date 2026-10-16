import type { Catalog } from "@alrisali/i18n";

import type { ar } from "./ar";

export const en: Catalog<typeof ar> = {
  title: "Today's worship",
  kind: {
    dua: "Dua of the day",
    ziyarah: "Ziyarah of the day",
    everyDay: "Every day",
    tonight: "Tonight's dua",
  },
};
