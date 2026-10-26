import type { Catalog } from "@alrisali/i18n";

import type { ar } from "./ar";

export const en: Catalog<typeof ar> = {
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
  header: {
    settings: "Location and Prayer Times options: {{place}}",
  },
  settings: {
    title: "Location and options",
  },
  timetable: {
    title: "Today's Prayer Times",
    notReached: "Not today",
    notReachedLabel: "{{name}}: not reached today at this location",
    current: "Now",
    shareTitle: "Prayer times",
    shareSeparator: " · ",
    allHidden:
      "Every Prayer Time is hidden. Show the ones you want in Prayer Times options.",
  },
  day: {
    previous: "Previous day",
    next: "Next day",
    today: "Today",
    pick: "Pick a date",
    hijri: "Hijri date",
    timetableTitle: "Prayer Times for {{date}}",
  },
  next: {
    title: "Next Prayer Time",
    remaining: "in {{countdown}}",
    at: "at {{time}}",
    accessibility: "{{name}} at {{time}}, in {{countdown}}",
    none: "No Prayer Times are shown.",
    noLocation: "Set your location to see Prayer Times.",
    setLocation: "Set location",
  },
  location: {
    title: "Location",
    unnamed: "Unnamed place",
    coordinates: "{{latitude}}, {{longitude}}",
    notSet: "You haven't set your location yet.",
    following: "Updates on its own when you travel.",
    chosen: "Chosen by you, so it stays put when you travel.",
    useDevice: "Use my current location",
    locating: "Finding your location…",
    denied:
      "Location access isn't allowed. Allow it in the device's Settings, or search for your city.",
    unavailable:
      "Couldn't find your location. Try again or search for your city.",
    search: "Search for a city",
    searchButton: "Search",
    searching: "Searching…",
    noResults: "No city found with that name.",
    searchFailed: "Search failed. Searching needs an internet connection.",
  },
  recent: {
    title: "Recent cities",
    timeZone: "Time zone: {{timeZone}}",
  },
  sanity: {
    title: "Some times need a look",
    undefined: "Can't be calculated on this day at this location: {{names}}.",
    outOfOrder: "Out of order: {{names}}.",
    fix: "Review Prayer settings",
  },
  highLatitude: {
    title: "Your location is at a high latitude",
    description:
      "In summer the sun may not reach the Fajr or Isha angle. Review the high-latitude rule in Prayer settings before you need it.",
    review: "Review settings",
    dismiss: "Later",
  },
  options: {
    title: "Prayer Times options",
    timeFormat: "Time format",
    hours: "{{hours}}-hour",
    imsakMinutes: "Imsak before Fajr (minutes)",
    shown: "Shown Prayer Times",
    shownDescription:
      "Turned-off Prayer Times are hidden from the timetable and the countdown.",
  },
};
