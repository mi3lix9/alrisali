import type { Catalog } from "@alrisali/i18n";

import type { ar } from "./ar";

// English plurals use only `_one` and `_other`; the rest mirror Arabic's
// forms so the catalogue keeps the same keys.
export const en: Catalog<typeof ar> = {
  title: "Prayer Log",
  description: "Tick each Salah you performed.",
  today: "Today",
  previousDay: "Previous day",
  nextDay: "Next day",
  salah: {
    fajr: "Fajr",
    dhuhr: "Dhuhr",
    asr: "Asr",
    maghrib: "Maghrib",
    isha: "Isha",
  },
  streak: {
    label: "Prayer Streak",
    days_zero: "No days yet",
    days_one: "{{count}} day",
    days_two: "{{count}} days",
    days_few: "{{count}} days",
    days_many: "{{count}} days",
    days_other: "{{count}} days",
    hint: "Log all five Salah today to keep your streak going.",
    today: "Today {{performed}} of {{total}}",
  },
  untick: {
    title: "Un-tick {{name}}?",
    message: "{{name}} will be removed from this day's Prayer Log.",
    cancel: "Keep",
    confirm: "Un-tick",
  },
  saveError: "Your change could not be saved. Try again.",
};
