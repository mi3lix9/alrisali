import {
  selectableAdhanSound,
  SYSTEM_SOUND_ID,
} from "@alrisali/domain/reminders";
import type {
  AdhanSound,
  ReminderRule,
  ReminderSound,
} from "@alrisali/domain/reminders";
import type { Language } from "@alrisali/i18n";
import type { TFunction } from "i18next";

import { minutesPhrase } from "./notification-request";
import type { ReminderKey } from "./reminder-key";

type Translate = TFunction<"reminders">;

/** The Reminder's tone choices, in the order they are listed. */
export const BEFORE_TONES = [
  "default",
  "chime",
  "bell",
  "voice",
  "silent",
] as const;

export type BeforeTone = (typeof BEFORE_TONES)[number];

/** The tone the Reminder before plays, after the rule's precedence. */
export const beforeToneOf = (rule: ReminderRule): BeforeTone => {
  if (rule.muted) {
    return "silent";
  }
  if (rule.voice) {
    return "voice";
  }
  return rule.sound satisfies ReminderSound;
};

/** The rule fields that make `tone` the Reminder's tone. */
export const beforeToneChange = (
  tone: BeforeTone
): Pick<ReminderRule, "muted" | "voice"> & { sound?: ReminderSound } => {
  switch (tone) {
    case "silent": {
      return { muted: true, voice: false };
    }
    case "voice": {
      return { muted: false, voice: true };
    }
    default: {
      return { muted: false, voice: false, sound: tone };
    }
  }
};

/** The installed voice the rule's At-Time sound comes from, if any. */
export const chosenVoice = (
  rule: ReminderRule,
  installed: readonly AdhanSound[]
): AdhanSound | undefined => {
  const id = selectableAdhanSound(rule.adhanSound, installed);
  return id === SYSTEM_SOUND_ID
    ? undefined
    : installed.find((sound) => sound.id === id);
};

/** "Hussein Sobhdel's full adhan at Dhuhr": what the At-Time Alert does. */
export const atTimeSentence = (
  t: Translate,
  language: Language,
  key: ReminderKey,
  rule: ReminderRule,
  installed: readonly AdhanSound[]
): string => {
  const name = t(`names.${key}`);
  switch (rule.atTime) {
    case "off": {
      return t("summary.atTime.off", { name });
    }
    case "silent": {
      return t("summary.atTime.silent", { name });
    }
    default: {
      const voice = chosenVoice(rule, installed);
      if (!voice) {
        return t("summary.atTime.takbirSystem", { name });
      }
      return t(
        rule.atTime === "adhan"
          ? "summary.atTime.adhan"
          : "summary.atTime.takbir",
        { name, voice: voice.name[language] }
      );
    }
  }
};

/** "5 minutes before" for the Reminder before, as a row's value. */
export const beforeValue = (
  t: Translate,
  language: Language,
  rule: ReminderRule
): string => {
  if (!rule.enabled) {
    return t("sheet.off");
  }
  if (rule.minutesBefore === 0) {
    return t("sheet.onTime");
  }
  return t("sheet.beforeValue", {
    minutes: minutesPhrase(t, language, rule.minutesBefore),
  });
};

/** "Chime, 5 minutes before", or that there is no reminder before. */
export const beforeSentence = (
  t: Translate,
  language: Language,
  rule: ReminderRule
): string => {
  if (!rule.enabled) {
    return t("summary.before.off");
  }
  const tone = t(`tones.${beforeToneOf(rule)}.title`);
  if (rule.minutesBefore === 0) {
    return t("summary.before.at", { tone });
  }
  return t("summary.before.on", {
    tone,
    minutes: minutesPhrase(t, language, rule.minutesBefore),
  });
};
