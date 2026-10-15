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
};
