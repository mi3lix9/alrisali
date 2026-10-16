import type { Catalog } from "@alrisali/i18n";

import type { ar } from "./ar";

export const en: Catalog<typeof ar> = {
  titles: {
    nextSalah: "Next prayer",
    todayTimes: "Today's times",
    hijriDate: "Hijri date",
    verseOfTheDay: "Verse of the Day",
    keepReading: "Keep reading",
    khatmah: "Khatmah",
  },
  names: {
    imsak: "Imsak",
    fajr: "Fajr",
    sunrise: "Sunrise",
    dhuhr: "Dhuhr",
    asr: "Asr",
    sunset: "Sunset",
    maghrib: "Maghrib",
    isha: "Isha",
    midnight: "Midnight",
  },
  noLocation: "Choose your location to see prayer times",
  following: "Then {{prayer}} {{time}}",
  reference: "{{surah}} {{ayah}}",
  page: "Page {{page}}",
  startReading: "Start reading",
  khatmah: {
    progress: "{{done}} of {{total}}",
    today: "Today: {{portion}}",
    doneToday: "Today's portion is done",
    ahead: "Ahead: {{count}}",
    behind: "Behind: {{count}}",
    start: "Start a Khatmah",
  },
};
