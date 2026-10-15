import type { Catalog } from "@alrisali/i18n";

import type { ar } from "./ar";

// English plurals use only `_one` and `_other`; the rest mirror Arabic's
// forms so the catalogue keeps the same keys.
export const en: Catalog<typeof ar> = {
  title: "Habits",
  description: "Tick each Habit you kept.",
  today: "Today",
  previousDay: "Previous day",
  nextDay: "Next day",
  noneDue: "No Habits are due on this day.",
  preset: {
    "quran-page": "Read one Quran Page",
    "morning-adhkar": "Morning adhkar",
    "evening-adhkar": "Evening adhkar",
    "drink-water": "Drink water",
  },
  streak: {
    label: "Streak",
    times_zero: "{{count}} in a row",
    times_one: "{{count}} in a row",
    times_two: "{{count}} in a row",
    times_few: "{{count}} in a row",
    times_many: "{{count}} in a row",
    times_other: "{{count}} in a row",
  },
  saveError: "Your change could not be saved. Try again.",
  manage: {
    title: "All Habits",
    description: "Archive what you no longer need, or delete it for good.",
    archived: "Archived",
    archive: "Archive",
    restore: "Restore",
    delete: "Delete",
    deleteTitle: "Delete “{{name}}”?",
    deleteMessage:
      "The Habit and everything you ticked for it will be deleted. This cannot be undone.",
    cancel: "Cancel",
    confirmDelete: "Delete",
  },
  schedule: {
    daily: "Every day",
    weekdays: "Chosen days",
    once: "Once",
    onDate: "On {{date}}",
    reminderAt: "Reminder at {{time}}",
  },
  weekday: {
    "1": "Monday",
    "2": "Tuesday",
    "3": "Wednesday",
    "4": "Thursday",
    "5": "Friday",
    "6": "Saturday",
    "7": "Sunday",
  },
  form: {
    newHabit: "New Habit",
    title: "New Habit",
    name: "Name",
    namePlaceholder: "e.g. Night prayer",
    invalidName: "Give the Habit a name.",
    repeat: "Repeat",
    days: "Days",
    invalidDays: "Choose at least one day.",
    date: "Date",
    reminder: "Reminder",
    reminderDescription:
      "A notification on this device at the time you choose.",
    reminderTime: "Reminder time",
    create: "Add Habit",
    failed: "The Habit could not be saved. Try again.",
  },
};
