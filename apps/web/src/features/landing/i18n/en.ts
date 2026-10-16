import { legalDocuments } from "@alrisali/i18n/legal";

import type { SiteCopy } from "./copy";

export const en: SiteCopy = {
  appName: "Al-Risali",
  nav: {
    home: "Home",
    privacy: "Privacy",
    terms: "Terms",
    contact: "Contact",
    otherLanguage: "العربية",
  },
  home: {
    metaTitle: "Al-Risali — your Shia spiritual companion",
    metaDescription:
      "Prayer times and tracking, the Quran, supplications, dhikr and daily acts of worship in one app for iPhone and Android.",
    tagline: "Your Shia spiritual companion",
    title: "Prayer, Quran, supplications and dhikr in one place",
    description:
      "Al-Risali brings together prayer times and tracking, the Holy Quran, the supplications of Ahl al-Bayt, the tasbih and your daily acts of worship. It works offline, and everything you record stays yours.",
    downloadHeading: "Download the app",
    appStore: { label: "App Store", caption: "Download on the" },
    playStore: { label: "Google Play", caption: "Get it on" },
    featuresHeading: "What's inside",
    features: [
      {
        title: "Prayer Times and reminders",
        description:
          "Accurate times for your location with the Calculation Method you follow, and reminders scheduled on your device.",
      },
      {
        title: "Prayer tracking",
        description:
          "Log each Salah, keep your Prayer Streak and reflect on your khushu.",
      },
      {
        title: "The Holy Quran",
        description:
          "The Madinah mushaf page by page or surah by surah, resuming where you stopped.",
      },
      {
        title: "Supplications and books",
        description:
          "Mafatih al-Jinan, al-Sahifa al-Sajjadiyya and more, with Recite-Along.",
      },
      {
        title: "Tasbih and dhikr",
        description:
          "Tasbih al-Zahra and an open tasbih that remember every session.",
      },
      {
        title: "Programs and occasions",
        description:
          "Programs of daily acts, the Hijri calendar of occasions, and gatherings near you.",
      },
    ],
    verse: {
      text: "وَاعْبُدْ رَبَّكَ حَتَّىٰ يَأْتِيَكَ الْيَقِينُ",
      translation: "And worship your Lord until certainty comes to you.",
      reference: "Al-Hijr 15:99",
    },
  },
  privacy: legalDocuments.en.privacy,
  terms: legalDocuments.en.terms,
  contact: {
    title: "Contact us",
    description:
      "Have a question, a suggestion or feedback? Send the Al-Risali team a message — no account needed.",
  },
};
