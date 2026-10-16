import type { Catalog } from "@alrisali/i18n";

import type { ar } from "./ar";

export const en: Catalog<typeof ar> = {
  title: "Khatmah",
  newTitle: "New Khatmah",
  from: "From {{surah}} {{ayah}}",
  to: "To {{surah}} {{ayah}}",
  ayahRef: "{{surah}} {{ayah}}",
  empty: {
    title: "Start a Khatmah",
    description:
      "Pick a plan to read the whole Quran; each day shows its portion and where to stop.",
    start: "New Khatmah",
  },
  plan: {
    heading: "Choose a plan",
    suggested: {
      title: "Suggested plan",
      description: "A juz a day, so you finish the Quran in 30 days.",
    },
    even: {
      title: "Even split",
      description:
        "Choose from 3 to 240 days; sessions are split by hizb quarters.",
    },
    days: "Number of days",
    decrease: "One day fewer",
    increase: "One day more",
    daysValue: "{{days}} days",
    preview: {
      perDay: "About {{pages}} pages a day",
      finish: "Finishes on {{hijri}} ({{gregorian}})",
    },
    select: "Select plan",
  },
  reminder: {
    title: "Daily reminder",
    description: "Reminds you of the day's portion at the time you choose.",
    time: "Reminder time",
  },
  start: "Start Khatmah",
  startError: "The Khatmah could not be saved. Try again.",
  status: {
    today: "Today's portion",
    portion: "From {{from}} to {{to}}",
    pagesInPortion_zero: "No pages",
    pagesInPortion_one: "{{count}} page",
    pagesInPortion_two: "{{count}} pages",
    pagesInPortion_few: "{{count}} pages",
    pagesInPortion_many: "{{count}} pages",
    pagesInPortion_other: "{{count}} pages",
    pagesRead: "Pages read: {{read}} of {{total}}",
    onTrack: "On track",
    ahead_zero: "Ahead",
    ahead_one: "Ahead by {{count}} session",
    ahead_two: "Ahead by {{count}} sessions",
    ahead_few: "Ahead by {{count}} sessions",
    ahead_many: "Ahead by {{count}} sessions",
    ahead_other: "Ahead by {{count}} sessions",
    behind_zero: "Behind",
    behind_one: "Behind by {{count}} session",
    behind_two: "Behind by {{count}} sessions",
    behind_few: "Behind by {{count}} sessions",
    behind_many: "Behind by {{count}} sessions",
    behind_other: "Behind by {{count}} sessions",
    finished: "You completed the Khatmah. May Allah accept it.",
    finish: "Estimated finish: {{hijri}} ({{gregorian}})",
    sessionsDone: "{{done}} of {{total}} done",
    open: "Open in the Quran",
  },
  sessions: {
    title: "Sessions",
    session: "Session {{n}}",
    done: "Done",
    missed: "Missed",
    today: "Today",
    upcoming: "Upcoming",
    relative: {
      today: "today",
      yesterday: "yesterday",
      tomorrow: "tomorrow",
    },
  },
  manage: {
    startOver: "New Khatmah",
    remove: "Delete Khatmah",
    removeConfirmTitle: "Delete this Khatmah?",
    removeConfirmDescription:
      "The Khatmah and its session history are deleted and cannot be restored.",
    cancel: "Cancel",
    confirmRemove: "Delete",
  },
  banner: {
    title: "Today's portion ends here",
    description: "Session {{n}} of {{total}}",
    complete: "Complete today's portion",
    completed: "Today's portion completed. May Allah accept it.",
    error: "Could not save. Try again.",
  },
};
