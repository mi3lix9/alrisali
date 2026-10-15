import type { Catalog } from "@alrisali/i18n";

import type { ar } from "./ar";

// English plurals use only `_one` and `_other`; the rest mirror Arabic's
// keys so the catalogues share one shape.
export const en: Catalog<typeof ar> = {
  title: "Insights",
  privacy: "Worked out on your phone from what you recorded, offline.",
  loadError: "Your Insights could not be worked out. Try again.",
  link: {
    title: "Insights",
    description:
      "Your Salah, Khushu, Habits and Dhikr over time, worked out on your phone.",
    open: "Open Insights",
  },
  overview: {
    title: "This week",
    prayerStreak: "Prayer Streak",
    days_zero: "{{count}} days",
    days_one: "{{count}} day",
    days_two: "{{count}} days",
    days_few: "{{count}} days",
    days_many: "{{count}} days",
    days_other: "{{count}} days",
    streakHint: "Log all five Salah today to keep your streak going.",
    salah: "Salah logged",
    salahValue: "{{logged}} of {{possible}}",
    khushu: "Average Khushu",
    khushuValue: "{{value}} / 10",
    khushuUp: "{{value}} up on last week",
    khushuDown: "{{value}} down on last week",
    khushuSame: "Same as last week",
    noKhushu: "No ratings yet",
    habits: "Habits done",
    noHabits: "No Habits due",
  },
  week: {
    title: "Last 7 days",
    description: "Salah logged each day.",
    day: "{{day}}: {{salah}} of 5 Salah",
  },
  heatmap: {
    title: "Last 12 weeks",
    description: "Each square is a day: Salah first, then Habits and Dhikr.",
    less: "Less",
    more: "More",
  },
  habits: {
    title: "Habit streaks",
    empty: "No Habits yet.",
    streak: "{{current}} now · best {{longest}}",
    preset: {
      "quran-page": "Read one Quran Page",
      "morning-adhkar": "Morning adhkar",
      "evening-adhkar": "Evening adhkar",
      "drink-water": "Drink water",
    },
  },
  tasbih: {
    title: "Tasbih totals",
    empty: "No Dhikr Sessions yet.",
    tasbihAlZahra: "Tasbih al-Zahra",
    removed: "Deleted Tasbih",
    sessions: "Sessions: {{sessions}}",
  },
  moods: {
    title: "Moods",
    description: "Last 30 days.",
    empty: "No Mood Check-ins in the last 30 days.",
    mood: {
      happy: "Happy",
      calm: "Calm",
      sad: "Sad",
      stressed: "Stressed",
      angry: "Angry",
    },
    other: "Other",
  },
  distractions: {
    title: "Distractions",
    description: "In the Salah you rated, last 30 days.",
    empty: "No Distractions in the Salah you rated.",
    distraction: {
      mindWandering: "Mind wandering",
      phoneNotifications: "Phone notifications",
      childrenNoise: "Children/noise",
      workRelated: "Work-related thoughts",
      fatigue: "Fatigue/sleepiness",
      laziness: "Laziness",
      environmental: "Environmental distractions",
    },
    custom: "Ones you typed",
    other: "Other",
  },
};
