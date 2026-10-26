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
    current: "Now",
    allHidden:
      "Every Prayer Time is hidden. Show the ones you want in Prayer Times options.",
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
