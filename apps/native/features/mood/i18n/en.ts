import type { Catalog } from "@alrisali/i18n";

import type { ar } from "./ar";

export const en: Catalog<typeof ar> = {
  title: "How do you feel today?",
  description: "Choose your mood for a saying or dua to answer it.",
  moods: {
    happy: "Happy",
    calm: "Calm",
    sad: "Sad",
    stressed: "Stressed",
    angry: "Angry",
  },
  remedy: "A Remedy for your heart",
  saveError: "Your mood could not be saved. Try again.",
};
