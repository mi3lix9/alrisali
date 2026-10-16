import { describe, expect, it } from "vitest";

import {
  applyReminderSettingsChange,
  atTimeAlert,
  DEFAULT_REMINDER_SETTINGS,
  readReminderRule,
  SALAH,
} from "./settings";

describe("a new Believer's reminder settings", () => {
  it("plays the short takbir at Fajr, Dhuhr and Maghrib, and nothing at Asr and Isha", () => {
    expect(
      Object.fromEntries(
        SALAH.map((salah) => [
          salah,
          DEFAULT_REMINDER_SETTINGS.salah[salah].atTime,
        ])
      )
    ).toStrictEqual({
      fajr: "takbir",
      dhuhr: "takbir",
      asr: "off",
      maghrib: "takbir",
      isha: "off",
    });
  });

  it("alerts at Imsak only in Ramadan", () => {
    expect(DEFAULT_REMINDER_SETTINGS.imsak).toMatchObject({
      atTime: "silent",
      ramadanOnly: true,
    });
  });

  it("uses the system sound until the Believer picks a voice", () => {
    expect(
      new Set(
        SALAH.map((salah) => DEFAULT_REMINDER_SETTINGS.salah[salah].adhanSound)
      )
    ).toStrictEqual(new Set(["system"]));
  });
});

describe(atTimeAlert, () => {
  const { fajr } = DEFAULT_REMINDER_SETTINGS.salah;

  it("gives nothing when the At-Time Alert is off, even with the Reminder on", () => {
    expect(atTimeAlert({ ...fajr, enabled: true, atTime: "off" })).toBeNull();
  });

  it("stays on when the Reminder before is switched off", () => {
    expect(atTimeAlert({ ...fajr, enabled: false })).toStrictEqual({
      kind: "takbir",
      adhanSound: "system",
    });
  });

  it("carries the chosen voice to the takbir and the full adhan", () => {
    expect(
      atTimeAlert({ ...fajr, atTime: "adhan", adhanSound: "a-voice" })
    ).toStrictEqual({ kind: "adhan", adhanSound: "a-voice" });
  });
});

describe(readReminderRule, () => {
  it("keeps the default At-Time Alert for a rule stored before it existed", () => {
    expect(
      readReminderRule(
        { enabled: true, minutesBefore: 10 },
        DEFAULT_REMINDER_SETTINGS.salah.maghrib
      )
    ).toMatchObject({ minutesBefore: 10, atTime: "takbir" });
  });

  it("ignores an At-Time Alert it does not know", () => {
    expect(
      readReminderRule(
        { atTime: "fanfare" },
        DEFAULT_REMINDER_SETTINGS.salah.isha
      ).atTime
    ).toBe("off");
  });
});

describe(applyReminderSettingsChange, () => {
  it("changes one Salah's At-Time Alert and leaves the rest", () => {
    const settings = applyReminderSettingsChange(DEFAULT_REMINDER_SETTINGS, {
      salah: { maghrib: { atTime: "adhan" } },
    });

    expect(settings.salah.maghrib.atTime).toBe("adhan");
    expect(settings.salah.fajr).toStrictEqual(
      DEFAULT_REMINDER_SETTINGS.salah.fajr
    );
  });

  it("refuses a sound id that is not a catalogue id", () => {
    expect(() =>
      applyReminderSettingsChange(DEFAULT_REMINDER_SETTINGS, {
        salah: { fajr: { adhanSound: "../secret" } },
      })
    ).toThrow("adhanSound");
  });
});
