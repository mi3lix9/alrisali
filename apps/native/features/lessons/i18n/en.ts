import type { Catalog } from "@alrisali/i18n";

import type { ar } from "./ar";

// English plurals use only `_one` and `_other`; the rest mirror Arabic's
// keys so the catalogues share one shape.
export const en: Catalog<typeof ar> = {
  title: "Lessons",
  link: {
    title: "Lessons",
    description: "Illustrated Lessons on aqeedah, fiqh, akhlaq and history.",
    completed: "{{completed}} of {{total}} completed",
    open: "Browse Lessons",
  },
  categories: {
    label: "Category",
    all: "All",
    aqeedah: "Aqeedah",
    fiqh: "Fiqh",
    akhlaq: "Akhlaq",
    history: "History",
  },
  empty: "No Lessons here yet.",
  loadError: "Lessons could not be loaded.",
  status: {
    new: "New",
    completed: "Completed",
  },
  seen: "{{seen}} of {{total}}",
  slides_zero: "No Slides",
  slides_one: "{{count}} Slide",
  slides_two: "{{count}} Slides",
  slides_few: "{{count}} Slides",
  slides_many: "{{count}} Slides",
  slides_other: "{{count}} Slides",
  slideOf: "Slide {{current}} of {{total}}",
  previous: "Previous",
  next: "Next",
  markComplete: "Mark complete",
  completed: "You completed this Lesson",
  notFound: "This Lesson is no longer available.",
  saveError: "Your progress could not be saved. Please try again.",
};
