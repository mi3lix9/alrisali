import type { Catalog } from "@alrisali/i18n";

import type { ar } from "./ar";

export const en: Catalog<typeof ar> = {
  title: "Hijri calendar",
  today: {
    title: "Today",
    noOccasions: "No Occasion today.",
    openCalendar: "Open the calendar",
  },
  month: {
    previous: "Previous month",
    next: "Next month",
    backToToday: "Back to today",
  },
  weekdays: {
    sat: "Sa",
    sun: "Su",
    mon: "Mo",
    tue: "Tu",
    wed: "We",
    thu: "Th",
    fri: "Fr",
  },
  day: {
    noOccasions: "No Occasion on this day.",
  },
  monthOccasions: "Occasions this month",
  occasionTypes: {
    celebration: "Celebration",
    mourning: "Mourning",
    religious: "Religious day",
    fasting: "Fast",
  },
};
