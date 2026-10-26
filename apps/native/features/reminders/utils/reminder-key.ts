import { SALAH } from "@alrisali/domain/reminders";
import type {
  ReminderRule,
  ReminderSettings,
  ReminderSettingsChange,
  Salah,
} from "@alrisali/domain/reminders";
import type { PrayerTimeName } from "@alrisali/domain/shared";

/** A Prayer Time that has a Reminder rule: a Salah, or Imsak. */
export type ReminderKey = Salah | "imsak";

/** The Reminder key of a Prayer Time, or null for one without a Reminder. */
export const reminderKeyOf = (name: PrayerTimeName): ReminderKey | null => {
  if (name === "imsak") {
    return name;
  }
  return SALAH.find((salah) => salah === name) ?? null;
};

export const ruleOf = (
  settings: ReminderSettings,
  key: ReminderKey
): ReminderRule => (key === "imsak" ? settings.imsak : settings.salah[key]);

/** A change to one rule, as the settings change that saves it. */
export const ruleChange = (
  key: ReminderKey,
  change: Partial<ReminderRule>
): ReminderSettingsChange =>
  key === "imsak" ? { imsak: change } : { salah: { [key]: change } };
