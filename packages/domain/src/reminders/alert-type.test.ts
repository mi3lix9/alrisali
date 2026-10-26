import { describe, expect, it } from "vitest";

import {
  ALERT_TYPES,
  alertTypeOf,
  reminderSummaryOf,
  ruleChangeForAlertType,
} from "./alert-type";
import { DEFAULT_REMINDER_SETTINGS } from "./settings";
import type { ReminderRule } from "./settings";

const base: ReminderRule = {
  ...DEFAULT_REMINDER_SETTINGS.salah.fajr,
  enabled: true,
  muted: false,
  voice: false,
};

describe("alert type of a rule", () => {
  it("is off whenever the rule is disabled, whatever else is set", () => {
    expect(
      alertTypeOf({ ...base, enabled: false, muted: true, voice: true })
    ).toBe("off");
  });

  it("is silent when muted, even with the voice on", () => {
    expect(alertTypeOf({ ...base, muted: true, voice: true })).toBe("silent");
    expect(alertTypeOf({ ...base, muted: true })).toBe("silent");
  });

  it("is adhan with the voice on and not muted", () => {
    expect(alertTypeOf({ ...base, voice: true })).toBe("adhan");
  });

  it("is tone otherwise", () => {
    expect(alertTypeOf(base)).toBe("tone");
  });
});

describe("rule change for an alert type", () => {
  it("round-trips every type from every starting rule", () => {
    const starts: ReminderRule[] = [];
    for (const enabled of [true, false]) {
      for (const muted of [true, false]) {
        for (const voice of [true, false]) {
          starts.push({ ...base, enabled, muted, voice });
        }
      }
    }
    for (const start of starts) {
      for (const type of ALERT_TYPES) {
        const changed = { ...start, ...ruleChangeForAlertType(type) };
        expect(alertTypeOf(changed)).toBe(type);
      }
    }
  });

  it("keeps the timing and sound choices", () => {
    for (const type of ALERT_TYPES) {
      const change = ruleChangeForAlertType(type);
      expect(change).not.toHaveProperty("minutesBefore");
      expect(change).not.toHaveProperty("sound");
      expect(change).not.toHaveProperty("adhan");
    }
  });
});

describe("summary of a rule", () => {
  it("says nothing but off for a disabled rule", () => {
    expect(reminderSummaryOf({ ...base, enabled: false })).toStrictEqual({
      kind: "off",
    });
  });

  it("names the muezzin and form of an Adhan", () => {
    expect(
      reminderSummaryOf({
        ...base,
        voice: true,
        adhan: "sobhdel-full",
        minutesBefore: 5,
      })
    ).toStrictEqual({
      kind: "adhan",
      muezzin: "sobhdel",
      form: "full",
      minutesBefore: 5,
    });
  });

  it("reports silent for muted plus voice", () => {
    expect(
      reminderSummaryOf({ ...base, muted: true, voice: true, minutesBefore: 0 })
    ).toStrictEqual({ kind: "silent", minutesBefore: 0 });
  });

  it("reports the tone", () => {
    expect(
      reminderSummaryOf({ ...base, sound: "bell", minutesBefore: 10 })
    ).toStrictEqual({ kind: "tone", sound: "bell", minutesBefore: 10 });
  });
});
