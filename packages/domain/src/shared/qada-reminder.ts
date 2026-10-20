import type { HabitSchedule } from "./habit-schedule";

/**
 * The Qada Reminder as the Reminders see it. Shared because the Qada tracker
 * keeps it and the Reminders schedule it.
 */
export interface QadaReminderPlan {
  /** The weekdays it fires on (every day, or chosen weekdays). */
  schedule: HabitSchedule;
  /** Minutes after local midnight the Reminder fires. */
  reminderAt: number;
  /** Qada Salah the pace asks for each day. */
  salahPerDay: number;
}
