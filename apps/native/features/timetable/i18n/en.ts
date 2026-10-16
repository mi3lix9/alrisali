import type { Catalog } from "@alrisali/i18n";

import type { ar } from "./ar";

export const en: Catalog<typeof ar> = {
  link: "Monthly timetable",
  monthly: {
    title: "Monthly timetable",
    gregorian: "Gregorian month",
    hijri: "Hijri month",
    previous: "Previous month",
    next: "Next month",
    columns: "Columns",
    rangeSeparator: " – ",
    subtitle: "{{place}} · {{range}}",
    subtitleNoPlace: "{{range}}",
    fileName: "prayer-times-{{month}}",
  },
  imsakiyya: {
    title: "Ramadan Imsakiyya",
    subtitle: "Ramadan {{year}} AH",
    subtitleWithPlace: "{{place}} · Ramadan {{year}} AH",
    fileName: "imsakiyya-ramadan-{{year}}",
    heroDay: "{{day}} Ramadan",
    heroFirst: "First day of Ramadan",
    imsak: "Imsak",
    iftar: "Iftar · Maghrib",
    qadrNote:
      "Laylat al-Qadr nights: {{first}}, {{second}} and {{third}} of Ramadan",
    qadrTag: "Qadr",
  },
  columnNames: {
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
  iftar: "Iftar",
  day: "Day",
  date: "Date",
  gregorian: "Gr.",
  hijri: "AH",
  noLocation: "Choose your location in the Prayer tab to see the timetable.",
  share: {
    image: "Image",
    pdf: "PDF",
    failed: "Couldn't share. Try again.",
  },
};
