import "../i18n";
import { useReminderScheduler } from "../hooks/use-reminder-scheduler";

/** Mounted once at the root: keeps the device's Reminders scheduled. */
export const ReminderScheduler = () => {
  useReminderScheduler();
  return null;
};
