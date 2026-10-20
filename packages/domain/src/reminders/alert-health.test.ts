import { describe, expect, it } from "vitest";

import {
  alertChecks,
  alertProblems,
  TEST_ALERT_DELAY_SECONDS,
} from "./alert-health";
import type { AlertHealthReadings } from "./alert-health";

const HEALTHY_ANDROID: AlertHealthReadings = {
  platform: "android",
  alertsInUse: true,
  notifications: true,
  sound: true,
  exactAlarms: true,
  batteryOptimised: false,
  autostart: { screenKnown: true, confirmed: true },
};

const HEALTHY_IOS: AlertHealthReadings = {
  ...HEALTHY_ANDROID,
  platform: "ios",
};

describe(alertChecks, () => {
  it("lists the Android checks, including autostart on a known phone maker", () => {
    expect(alertChecks(HEALTHY_ANDROID).map((check) => check.id)).toStrictEqual(
      ["notifications", "exactAlarms", "batteryOptimisation", "autostart"]
    );
  });

  it("leaves out autostart when the phone maker has none we know", () => {
    const checks = alertChecks({
      ...HEALTHY_ANDROID,
      autostart: { screenKnown: false, confirmed: false },
    });
    expect(checks.map((check) => check.id)).not.toContain("autostart");
  });

  it("lists the iPhone checks: notifications and sound", () => {
    expect(alertChecks(HEALTHY_IOS).map((check) => check.id)).toStrictEqual([
      "notifications",
      "sound",
    ]);
  });

  it("passes every check on a healthy phone", () => {
    expect(
      alertChecks(HEALTHY_ANDROID).every((c) => c.status === "ok")
    ).toBeTruthy();
    expect(
      alertChecks(HEALTHY_IOS).every((c) => c.status === "ok")
    ).toBeTruthy();
  });

  it("fails each check on what the phone reports", () => {
    const failing = alertChecks({
      ...HEALTHY_ANDROID,
      notifications: false,
      exactAlarms: false,
      batteryOptimised: true,
      autostart: { screenKnown: true, confirmed: false },
    });
    expect(failing.map((check) => check.status)).toStrictEqual([
      "failing",
      "failing",
      "failing",
      "failing",
    ]);
  });

  it("fails sound on an iPhone that mutes the app's notifications", () => {
    const checks = alertChecks({ ...HEALTHY_IOS, sound: false });
    expect(checks.find((check) => check.id === "sound")?.status).toBe(
      "failing"
    );
  });
});

describe(alertProblems, () => {
  it("is empty while every check passes", () => {
    expect(alertProblems(HEALTHY_ANDROID)).toStrictEqual([]);
    expect(alertProblems(HEALTHY_IOS)).toStrictEqual([]);
  });

  it("names the failing checks, the most serious first", () => {
    expect(
      alertProblems({
        ...HEALTHY_ANDROID,
        batteryOptimised: true,
        notifications: false,
      })
    ).toStrictEqual(["notifications", "batteryOptimisation"]);
  });

  it("is empty when no alert is set to arrive, whatever the phone says", () => {
    expect(
      alertProblems({
        ...HEALTHY_ANDROID,
        alertsInUse: false,
        notifications: false,
      })
    ).toStrictEqual([]);
  });
});

describe("test alert delay", () => {
  it("fires well within a minute", () => {
    expect(TEST_ALERT_DELAY_SECONDS).toBeGreaterThan(0);
    expect(TEST_ALERT_DELAY_SECONDS).toBeLessThanOrEqual(60);
  });
});
