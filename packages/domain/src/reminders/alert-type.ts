import { adhanOf } from "./adhan";
import type { AdhanForm, Muezzin } from "./adhan";
import { reminderAlert } from "./settings";
import type { ReminderRule, ReminderSound } from "./settings";

/** How a Reminder alerts, as the Believer chooses it; every type but Off is on. */
export const ALERT_TYPES = ["off", "silent", "tone", "adhan"] as const;

export type AlertType = (typeof ALERT_TYPES)[number];

/**
 * The one alert type a rule stands for. Precedence: disabled, then muted, then
 * voice, then tone, so a rule with both `muted` and `voice` set is Silent.
 */
export const alertTypeOf = (rule: ReminderRule): AlertType => {
  const alert = reminderAlert(rule);
  if (!alert) {
    return "off";
  }
  switch (alert.kind) {
    case "silent": {
      return "silent";
    }
    case "voice": {
      return "adhan";
    }
    default: {
      return "tone";
    }
  }
};

/**
 * The fields to change so a rule reads as `type`. The tone and Adhan choices
 * stay as they are, so switching away and back loses nothing.
 */
export const ruleChangeForAlertType = (
  type: AlertType
): Partial<ReminderRule> => {
  switch (type) {
    case "off": {
      return { enabled: false };
    }
    case "silent": {
      return { enabled: true, muted: true };
    }
    case "tone": {
      return { enabled: true, muted: false, voice: false };
    }
    default: {
      return { enabled: true, muted: false, voice: true };
    }
  }
};

/** What a rule's summary sentence says, before it is worded. */
export type ReminderSummary =
  | { kind: "off" }
  | { kind: "silent"; minutesBefore: number }
  | { kind: "tone"; sound: ReminderSound; minutesBefore: number }
  | {
      kind: "adhan";
      muezzin: Muezzin;
      form: AdhanForm;
      minutesBefore: number;
    };

export const reminderSummaryOf = (rule: ReminderRule): ReminderSummary => {
  const { minutesBefore } = rule;
  switch (alertTypeOf(rule)) {
    case "off": {
      return { kind: "off" };
    }
    case "silent": {
      return { kind: "silent", minutesBefore };
    }
    case "tone": {
      return { kind: "tone", sound: rule.sound, minutesBefore };
    }
    default: {
      const { muezzin, form } = adhanOf(rule.adhan);
      return { kind: "adhan", muezzin, form, minutesBefore };
    }
  }
};
