import {
  adhanOf,
  alertTypeOf,
  reminderSummaryOf,
} from "@alrisali/domain/reminders";
import type {
  AdhanId,
  ReminderRule,
  ReminderSound,
} from "@alrisali/domain/reminders";
import type { Language } from "@alrisali/i18n";
import type { TFunction } from "i18next";

import { minutesPhrase } from "./minutes-phrase";
import type { ReminderKey } from "./reminder-key";
import type { PreviewSoundId } from "./sound-files";

/** "5 minutes before Dhuhr", or "when Dhuhr begins" for an on-time Reminder. */
export const timingSentence = (
  t: TFunction<"reminders">,
  language: Language,
  key: ReminderKey,
  minutesBefore: number
): string => {
  const name = t(`names.${key}`);
  return minutesBefore === 0
    ? t("summary.at", { name })
    : t("summary.before", {
        name,
        minutes: minutesPhrase(t, language, minutesBefore),
      });
};

/** What a rule will do, as one sentence: "Hussein Sobhdel's full Adhan 5 minutes before Dhuhr". */
export const summarySentence = (
  t: TFunction<"reminders">,
  language: Language,
  key: ReminderKey,
  rule: ReminderRule
): string => {
  const summary = reminderSummaryOf(rule);
  if (summary.kind === "off") {
    return t("summary.off", { name: t(`names.${key}`) });
  }
  let sound: string;
  switch (summary.kind) {
    case "silent": {
      sound = t("summary.silent");
      break;
    }
    case "tone": {
      sound =
        summary.sound === "default"
          ? t("summary.toneDefault")
          : t("summary.tone", { sound: t(`rule.sounds.${summary.sound}`) });
      break;
    }
    default: {
      sound = t(
        summary.form === "full" ? "summary.adhanFull" : "summary.adhanTakbeer",
        { muezzin: t(`rule.muezzins.${summary.muezzin}`) }
      );
    }
  }
  return t("summary.line", {
    sound,
    timing: timingSentence(t, language, key, summary.minutesBefore),
  });
};

/** The sound a rule previews: its tone's file or its Adhan, none when silent, off or the system tone. */
export const previewIdOf = (rule: ReminderRule): PreviewSoundId | null => {
  const summary = reminderSummaryOf(rule);
  if (summary.kind === "tone") {
    return summary.sound === "default" ? null : summary.sound;
  }
  return summary.kind === "adhan" ? rule.adhan : null;
};

export const toneName = (
  t: TFunction<"reminders">,
  sound: ReminderSound
): string => t(`rule.sounds.${sound}`);

/** "Hussein Sobhdel: Full Adhan". */
export const adhanName = (t: TFunction<"reminders">, id: AdhanId): string => {
  const { muezzin, form } = adhanOf(id);
  return t("rule.adhanOption", {
    muezzin: t(`rule.muezzins.${muezzin}`),
    form: t(`rule.adhanForms.${form}`),
  });
};

/** The name of the sound a rule plays: its Adhan when that is its alert, else its tone. */
export const ruleSoundName = (
  t: TFunction<"reminders">,
  rule: ReminderRule
): string =>
  alertTypeOf(rule) === "adhan"
    ? adhanName(t, rule.adhan)
    : toneName(t, rule.sound);
