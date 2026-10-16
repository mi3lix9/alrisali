import type { Temporal } from "temporal-polyfill";

/** A portion of the Quran by its first and last ayah (`surah:ayah`). */
export interface KhatmahReminderPortion {
  from: `${number}:${number}`;
  to: `${number}:${number}`;
}

/**
 * The Khatmah's daily reminder as the Reminders see it. Shared because the
 * Khatmah keeps it and the Reminders schedule it.
 */
export interface KhatmahReminderPlan {
  /** Minutes after local midnight the Reminder fires. */
  reminderAt: number;
  /** The date `portions[0]` is read; each later portion a day after. */
  firstDate: Temporal.PlainDate;
  /** The portions still to read, in order. */
  portions: readonly KhatmahReminderPortion[];
}
