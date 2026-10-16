import { SALAH } from "./settings";
import type {
  AtTimeAlert,
  ReminderSettings,
  ReminderSettingsChange,
} from "./settings";

/** The change that gives every Salah the same At-Time Alert ("enable all"). */
export const atTimeForAllSalah = (
  atTime: AtTimeAlert
): ReminderSettingsChange => ({
  salah: Object.fromEntries(SALAH.map((salah) => [salah, { atTime }])),
});

/** Whether every Salah has this At-Time Alert. */
export const allSalahAtTime = (
  settings: ReminderSettings,
  atTime: AtTimeAlert
): boolean => SALAH.every((salah) => settings.salah[salah].atTime === atTime);

/**
 * Whether anything is set to arrive as a notification (an At-Time Alert or a
 * Reminder before a Prayer Time): the moment the Believer first needs the
 * notification permission.
 */
export const sendsNotifications = (settings: ReminderSettings): boolean =>
  [...Object.values(settings.salah), settings.imsak].some(
    (rule) => rule.enabled || rule.atTime !== "off"
  );
