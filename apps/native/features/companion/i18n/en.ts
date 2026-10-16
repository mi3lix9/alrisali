import type { Catalog } from "@alrisali/i18n";

import type { ar } from "./ar";

export const en: Catalog<typeof ar> = {
  title: "Your Companion",
  level: "Level {{level}}",
  xp_zero: "{{count}} XP",
  xp_one: "{{count}} XP",
  xp_two: "{{count}} XP",
  xp_few: "{{count}} XP",
  xp_many: "{{count}} XP",
  xp_other: "{{count}} XP",
  xpToNextLevel_zero: "{{count}} XP to next level",
  xpToNextLevel_one: "{{count}} XP to next level",
  xpToNextLevel_two: "{{count}} XP to next level",
  xpToNextLevel_few: "{{count}} XP to next level",
  xpToNextLevel_many: "{{count}} XP to next level",
  xpToNextLevel_other: "{{count}} XP to next level",
  progressLabel: "Progress to the next level",
  theme: "Companion theme",
  themes: {
    traveler: "Traveler",
    garden: "Garden",
  },
  stages: {
    seedling: "Seedling",
    sprout: "Sprout",
    bloom: "Bloom",
    tree: "Mighty Tree",
    garden: "Spiritual Garden",
    seeker: "Seeker",
    wayfarer: "Wayfarer",
    pilgrim: "Pilgrim",
    guidingLight: "Guiding Light",
    travellingSpirit: "Travelling Spirit",
  },
  tips: {
    seedling:
      "Every journey begins with a single step. Keep nurturing your soul!",
    sprout: "You're growing stronger! Stay consistent with your habits.",
    bloom: "Beautiful progress! Your dedication is blossoming.",
    tree: "Strong roots bring abundant fruits. Keep going!",
    garden: "MashaAllah! You've cultivated a beautiful spiritual garden.",
    seeker: "The journey of a thousand miles begins with a single step.",
    wayfarer:
      "Be in this world as if you were a stranger or a traveler. - Prophet Muhammad (ﷺ)",
    pilgrim: "Patience is the key to relief. - Imam Ali (a.s)",
    guidingLight:
      "The best of people are those who benefit others. - Prophet Muhammad (ﷺ)",
    travellingSpirit:
      "The soul is a traveler; the body is its vehicle. Keep journeying toward Allah.",
  },
  levelUp: {
    title: "MashaAllah! You reached level {{level}}",
    description: "Your Companion grows with your devotion: {{stage}}",
  },
  themeError: "The theme could not be changed. Try again.",
};
