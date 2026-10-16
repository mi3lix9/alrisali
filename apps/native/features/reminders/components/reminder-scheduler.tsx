import "../i18n";
import type { HabitReminderPlan } from "@alrisali/domain/shared";

import { useAdhanOnOpen } from "../hooks/use-adhan-on-open";
import { useReminderScheduler } from "../hooks/use-reminder-scheduler";

/**
 * Mounted once at the root: keeps the device's Reminders scheduled, and plays
 * the full adhan when an At-Time Alert is opened. The route passes the Habit
 * Reminders in (undefined while they load).
 */
export const ReminderScheduler = ({
  habits,
}: {
  habits: readonly HabitReminderPlan[] | undefined;
}) => {
  useReminderScheduler(habits);
  useAdhanOnOpen();
  return null;
};
