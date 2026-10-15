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
      "panel-ui": "The app's interface components.",
      "open-source":
        "Built on Expo, React Native and other open-source libraries, each under its own licence. Al-Risali's own code is MIT-licensed.",
    },
  },
};
