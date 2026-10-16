import "../i18n";
import type {
  HabitReminderPlan,
  QadaReminderPlan,
} from "@alrisali/domain/shared";

import { useReminderScheduler } from "../hooks/use-reminder-scheduler";

/**
 * Mounted once at the root: keeps the device's Reminders scheduled. The route
 * passes the Habit Reminders and the Qada Reminder in (undefined while they
 * load).
 */
export const ReminderScheduler = ({
  habits,
  qada,
}: {
  habits: readonly HabitReminderPlan[] | undefined;
  qada: QadaReminderPlan | null | undefined;
}) => {
  useReminderScheduler(habits, qada);
  return null;
};
