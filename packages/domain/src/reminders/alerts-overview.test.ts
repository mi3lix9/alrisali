import { describe, expect, it } from "vitest";

import {
  allSalahAtTime,
  atTimeForAllSalah,
  sendsNotifications,
} from "./alerts-overview";
import {
  applyReminderSettingsChange,
  DEFAULT_REMINDER_SETTINGS,
} from "./settings";

describe(atTimeForAllSalah, () => {
  it("sets the At-Time Alert of every Salah and leaves the rest as it was", () => {
    const settings = applyReminderSettingsChange(
      DEFAULT_REMINDER_SETTINGS,
      atTimeForAllSalah("takbir")
    );
    expect(
      Object.values(settings.salah).map((rule) => rule.atTime)
    ).toStrictEqual(["takbir", "takbir", "takbir", "takbir", "takbir"]);
    expect(settings.imsak).toStrictEqual(DEFAULT_REMINDER_SETTINGS.imsak);
    expect(settings.salah.asr.enabled).toBeFalsy();
  });

  it("turns every At-Time Alert off", () => {
    const settings = applyReminderSettingsChange(
      DEFAULT_REMINDER_SETTINGS,
      atTimeForAllSalah("off")
    );
    expect(allSalahAtTime(settings, "off")).toBeTruthy();
  });
});

describe(allSalahAtTime, () => {
  it("is false for the defaults, which differ per Salah", () => {
    expect(allSalahAtTime(DEFAULT_REMINDER_SETTINGS, "takbir")).toBeFalsy();
  });
});

describe(sendsNotifications, () => {
  it("is true for the defaults", () => {
    expect(sendsNotifications(DEFAULT_REMINDER_SETTINGS)).toBeTruthy();
  });

  it("is false when every alert and Reminder is off", () => {
    const settings = applyReminderSettingsChange(DEFAULT_REMINDER_SETTINGS, {
      ...atTimeForAllSalah("off"),
      salah: {
        fajr: { atTime: "off", enabled: false },
        dhuhr: { atTime: "off", enabled: false },
        asr: { atTime: "off", enabled: false },
        maghrib: { atTime: "off", enabled: false },
        isha: { atTime: "off", enabled: false },
      },
      imsak: { atTime: "off", enabled: false },
    });
    expect(sendsNotifications(settings)).toBeFalsy();
  });

  it("is true when only a Reminder before a Prayer Time is on", () => {
    const off = applyReminderSettingsChange(DEFAULT_REMINDER_SETTINGS, {
      salah: {
        fajr: { atTime: "off", enabled: true },
        dhuhr: { atTime: "off", enabled: false },
        asr: { atTime: "off", enabled: false },
        maghrib: { atTime: "off", enabled: false },
        isha: { atTime: "off", enabled: false },
      },
      imsak: { atTime: "off", enabled: false },
    });
    expect(sendsNotifications(off)).toBeTruthy();
  });
});
