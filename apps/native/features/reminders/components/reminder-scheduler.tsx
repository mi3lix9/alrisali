import "../i18n";
import type { NightDuaPlan } from "@alrisali/domain/reminders";
import type {
  HabitReminderPlan,
  KhatmahReminderPlan,
  QadaReminderPlan,
} from "@alrisali/domain/shared";

import { useAdhanOnOpen } from "../hooks/use-adhan-on-open";
import { useReminderScheduler } from "../hooks/use-reminder-scheduler";

/**
 * Mounted once at the root: keeps the device's Reminders scheduled, and plays
 * the full adhan when an At-Time Alert is opened. The route passes the Habit
 * Reminders, the Qada Reminder and the Khatmah's Reminder in (undefined
 * while they load).
 */
export const ReminderScheduler = ({
  habits,
  qada,
  khatmah,
  worship,
}: {
  habits: readonly HabitReminderPlan[] | undefined;
  qada: QadaReminderPlan | null | undefined;
  khatmah: KhatmahReminderPlan | null | undefined;
  /** The worship mapping (the ziyarah Reminder); undefined while it loads. */
  worship: NightDuaPlan["worship"] | undefined;
}) => {
  useReminderScheduler(habits, qada, khatmah, worship);
  useAdhanOnOpen();
  return null;
};
