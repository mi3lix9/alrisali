import type { Catalog } from "@alrisali/i18n";

import type { ar } from "./ar";

export const en: Catalog<typeof ar> = {
  language: {
    title: "Language",
    description: "Language and layout direction apply when the app restarts.",
    ar: "العربية",
    en: "English",
    restartNow: "Restart now",
  },
  theme: {
    title: "Appearance",
    system: "System",
    light: "Light",
    dark: "Dark",
  },
  location: {
    title: "Location",
    description: "Prayer Times are calculated for this location.",
    notSet: "You haven't set your location yet.",
    name: "Place name (optional)",
    latitude: "Latitude",
    longitude: "Longitude",
    invalid:
      "Latitude must be between -90 and 90, longitude between -180 and 180.",
    save: "Save location",
  },
  calculationMethod: {
    title: "Calculation Method",
    description: "The rules used to calculate Prayer Times.",
    jafari: "Ja'fari",
    sunni: "Sunni",
    hanafi: "Hanafi",
    ibadi: "Ibadi",
  },
  hijriAdjustment: {
    title: "Hijri Adjustment",
    description:
      "Move the Hijri Date up to two days back or ahead to match the moon sighting you follow. It applies to every Hijri Date in the app.",
    today: "Today: {{date}}",
    minus2: "2 days back",
    minus1: "1 day back",
    none: "No adjustment",
    plus1: "1 day ahead",
    plus2: "2 days ahead",
  },
  reminders: {
    title: "Prayer Reminders",
    description: "A Reminder before each Salah and at Imsak, and quiet hours.",
    open: "Reminder settings",
  },
  messageStyle: {
    title: "Message Style",
    description: "The voice the app speaks to you in, in Reminders and beyond.",
    classic: "Classic",
    classicHint: "Verses and sayings, with their sources.",
    modern: "Modern",
    modernHint: "Gentle, motivating coaching.",
  },
  textSize: {
    title: "Text size",
    small: "Small",
    default: "Default",
    large: "Large",
    larger: "Larger",
    preview: "In the name of Allah, the Most Gracious, the Most Merciful",
  },
  tabs: {
    title: "Tabs",
    description: "Choose which tabs appear in the tab bar.",
    homeAlwaysShown: "Home is always shown.",
  },
  about: {
    title: "About",
    sources: "Sources & Credits",
    privacy: "Privacy Policy",
    terms: "Terms of Service",
    contact: "Contact us",
  },
  sources: {
    title: "Sources & Credits",
    intro:
      "Al-Risali is free. We thank those who made these texts and tools available; each keeps its own licence.",
    content: "Content",
    software: "Software",
    licence: "Licence: {{licence}}",
    credits: {
      kfgqpc:
        "The Quran text (Hafs), the mushaf's pages and lines, and the Uthmanic font, from the developer release of the King Fahd Glorious Qur'an Printing Complex.",
      thaqalayn:
        "Arabic texts and English translations of Mafatih al-Jinan, al-Sahifa al-Sajjadiyya and Nahj al-Balagha, from the Thaqalayn library, reformatted for offline reading. Not endorsed by Thaqalayn.",
      "quran-foundation":
        "Recitation audio and the Verse of the Day are streamed from Quran.Foundation. Quran data provided by Quran.Foundation.",
      "adhan-recording":
        "The Adhan voice of Prayer Time Reminders: the opening of a Shia Adhan recorded by Saeed Hatamzadeh-Varmazyar, from Wikimedia Commons, under CC BY-SA 4.0, shortened and converted to WAV.",
      tanzil:
        "Where each hizb quarter begins, from Tanzil's Quran metadata, corrected to the quarter signs in the KFGQPC text.",
      "panel-ui": "The app's interface components.",
      "open-source":
        "Built on Expo, React Native and other open-source libraries, each under its own licence. Al-Risali's own code is MIT-licensed.",
    },
  },
};
