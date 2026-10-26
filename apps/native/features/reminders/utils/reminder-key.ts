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

/** The Prayer Times with an At-Time Alert, in the day's order. */
export const REMINDER_KEYS: readonly ReminderKey[] = ["imsak", ...SALAH];

/** The Reminder key of a Prayer Time, or null for one without a Reminder. */
export const reminderKeyOf = (name: PrayerTimeName): ReminderKey | null =>
  REMINDER_KEYS.find((key) => key === name) ?? null;

export const ruleOf = (
  settings: ReminderSettings,
  key: ReminderKey
): ReminderRule => (key === "imsak" ? settings.imsak : settings.salah[key]);

/**
 * A change to one rule, as the settings change that saves it. Imsak has no
 * full adhan, so it takes the takbir instead.
 */
export const ruleChange = (
  key: ReminderKey,
  change: Partial<ReminderRule>
): ReminderSettingsChange => {
  if (key === "imsak") {
    const { atTime, ...rest } = change;
    return {
      imsak: {
        ...rest,
        ...(atTime === undefined
          ? {}
          : { atTime: atTime === "adhan" ? "takbir" : atTime }),
      },
    };
  }
  return { salah: { [key satisfies Salah]: change } };
};
