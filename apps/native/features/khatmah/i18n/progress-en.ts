import type { Catalog } from "@alrisali/i18n";

import type { progressAr } from "./progress-ar";

export const progressEn: Catalog<typeof progressAr> = {
  continue: {
    label: "Khatmah",
  },
  reschedule: {
    action: "Reschedule",
    title: "Reschedule the Khatmah",
    description: "Choose how to catch up on what you missed.",
    extendEnd: {
      title: "Push the end date back",
      description: "Portions stay the same size; the end date moves later.",
    },
    keepEnd: {
      title: "Keep the end date",
      description:
        "The portions left grow so you still finish on the same day.",
    },
    finish: "Finishes on {{hijri}} ({{gregorian}})",
    remaining: "{{n}} sessions left, about {{pages}} pages each",
    unavailable: "The end date has passed, so it cannot be kept.",
    done: "The Khatmah was rescheduled.",
    error: "Could not reschedule. Try again.",
    cancel: "Cancel",
  },
  markTill: {
    title: "Mark done till…",
    page: "The end of this page",
    ayah: "This ayah",
    portion: "The end of the portion",
    done: "Your progress is saved. May Allah accept it.",
    error: "Could not save. Try again.",
  },
  celebration: {
    title: "Mashallah, you completed the Khatmah!",
    description: "May Allah accept it from you. You finished in {{days}} days.",
    dua: "Dua after completing the Quran",
    repeat: "Repeat this plan",
    startNew: "Start a new Khatmah",
    repeatError: "Could not start the Khatmah. Try again.",
  },
  history: {
    title: "Completed Khatmahs",
    entry: "{{date}} · {{days}} days",
    chart: "Pages in each session",
    bar: "Session {{session}}: {{pages}} pages",
  },
};
