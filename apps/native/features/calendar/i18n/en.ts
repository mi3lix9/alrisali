import type { Catalog } from "@alrisali/i18n";

import type { ar } from "./ar";

export const en: Catalog<typeof ar> = {
  title: "Hijri calendar",
  today: {
    title: "Today",
    noOccasions: "No Occasion today.",
    openCalendar: "Open the calendar",
    separator: ", ",
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
  converter: {
    title: "Date converter",
    today: "Today",
    from: "From",
    calendars: {
      hijri: "Hijri",
      gregorian: "Gregorian",
      shamsi: "Shamsi",
    },
    wheels: {
      day: "Day",
      month: "Month",
      year: "Year",
    },
    swap: "Swap",
    copy: "Copy {{date}}",
    copied: "Date copied",
    openInCalendar: "Open in the calendar",
    hijriNote: {
      title: "The Hijri Date follows your calendar",
      body: "It includes the Admins' adjustment and your own. It may differ by a day from other countries.",
    },
    shamsiDate: "{{day}} {{month}} {{year}} SH",
    shamsiMonths: {
      farvardin: "Farvardin",
      ordibehesht: "Ordibehesht",
      khordad: "Khordad",
      tir: "Tir",
      mordad: "Mordad",
      shahrivar: "Shahrivar",
      mehr: "Mehr",
      aban: "Aban",
      azar: "Azar",
      dey: "Dey",
      bahman: "Bahman",
      esfand: "Esfand",
    },
  },
};
