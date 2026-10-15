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
};
