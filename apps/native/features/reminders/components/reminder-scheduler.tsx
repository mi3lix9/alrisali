import "../i18n";
import type { HabitReminderPlan } from "@alrisali/domain/shared";

import { useReminderScheduler } from "../hooks/use-reminder-scheduler";

/**
 * Mounted once at the root: keeps the device's Reminders scheduled. The route
 * passes the Habit Reminders in (undefined while they load).
 */
export const ReminderScheduler = ({
  habits,
}: {
  habits: readonly HabitReminderPlan[] | undefined;
}) => {
  useReminderScheduler(habits);
  return null;
};
