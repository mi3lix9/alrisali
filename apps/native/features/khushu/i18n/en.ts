import type { Catalog } from "@alrisali/i18n";

import type { ar } from "./ar";

export const en: Catalog<typeof ar> = {
  title: "Khushu in {{salah}}",
  description: "How present were you? Pick what distracted you.",
  level: "Khushu",
  distracted: "Distracted",
  focused: "Full Khushu",
  distractions: "Distractions",
  customDistraction: "Another distraction",
  customDistractionPlaceholder: "Type what distracted you…",
  distraction: {
    mindWandering: "Mind wandering",
    phoneNotifications: "Phone notifications",
    childrenNoise: "Children/noise",
    workRelated: "Work-related thoughts",
    fatigue: "Fatigue/sleepiness",
    laziness: "Laziness",
    environmental: "Environmental distractions",
  },
  salah: {
    fajr: "Fajr",
    dhuhr: "Dhuhr",
    asr: "Asr",
    maghrib: "Maghrib",
    isha: "Isha",
  },
  save: "Save",
  remove: "Remove",
  rate: "Rate Khushu",
  rated: "Khushu {{level}}/10",
  confirmRemove: {
    title: "Remove Khushu for {{salah}}?",
    message: "This Salah's Khushu rating and Distractions will be removed.",
    cancel: "Keep",
    confirm: "Remove",
  },
  saveError: "Your Khushu could not be saved. Try again.",
};
