import type { Catalog } from "@alrisali/i18n";

import type { ar } from "./ar";

export const en: Catalog<typeof ar> = {
  title: "Favorites",
  empty:
    "Tap the heart on a Surah, Supplication or Library material to keep it here.",
  add: "Add to Favorites",
  remove: "Remove from Favorites",
  kind: {
    surah: "Surah",
    ayah: "Ayah",
    supplication: "Supplication",
    "library-asset": "Library material",
  },
  ayahTitle: "{{surah}}, ayah {{ayah}}",
};
