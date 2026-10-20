import type { Catalog } from "@alrisali/i18n";

import type { ar } from "./ar";

export const en: Catalog<typeof ar> = {
  title: "Favorites",
  empty:
    "Tap the heart on a Surah, Supplication or Library material to keep it here.",
  add: "Add to Favorites",
  remove: "Remove from Favorites",
  saved: "In Favorites",
  kind: {
    surah: "Surah",
    ayah: "Ayah",
    supplication: "Supplication",
    "library-asset": "Library material",
  },
  ayahTitle: "{{surah}}, ayah {{ayah}}",
  open: "All Favorites",
  ayahEmpty:
    "No favorite ayat yet. Long-press any ayah in the mushaf, then add it to your Favorites.",
  emptyTab: "Nothing in this tab yet.",
  tabs: {
    label: "Favorites tabs",
    allCount: "All · {{count}}",
    quran: "Quran",
    supplications: "Supplications",
  },
  select: {
    start: "Select",
    cancel: "Cancel",
  },
  delete: {
    pick: "Choose items to delete",
    button_zero: "Delete",
    button_one: "Delete {{count}} item",
    button_two: "Delete {{count}} items",
    button_few: "Delete {{count}} items",
    button_many: "Delete {{count}} items",
    button_other: "Delete {{count}} items",
    title_zero: "Delete from Favorites?",
    title_one: "Delete {{count}} item from Favorites?",
    title_two: "Delete {{count}} items from Favorites?",
    title_few: "Delete {{count}} items from Favorites?",
    title_many: "Delete {{count}} items from Favorites?",
    title_other: "Delete {{count}} items from Favorites?",
    message: "This cannot be undone.",
    cancel: "Cancel",
    confirm: "Delete",
  },
};
