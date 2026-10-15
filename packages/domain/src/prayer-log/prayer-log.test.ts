import { Temporal } from "temporal-polyfill";
import { describe, expect, it } from "vitest";

import { canLogDate, prayerStreak, setSalahPerformed } from "./prayer-log";
import type { PrayerLog } from "./prayer-log";

const ALL_FIVE = ["fajr", "dhuhr", "asr", "maghrib", "isha"] as const;

const day = (iso: string) => Temporal.PlainDate.from(iso);

const complete = (iso: string): PrayerLog => ({
  date: day(iso),
  performed: [...ALL_FIVE],
});

const partial = (iso: string): PrayerLog => ({
  date: day(iso),
  performed: ["fajr", "dhuhr", "asr", "maghrib"],
});

describe(prayerStreak, () => {
  it("is 0 with no Prayer Logs", () => {
    expect(prayerStreak([], day("2026-10-15"))).toBe(0);
  });

  it("counts consecutive complete days ending on the date", () => {
    const logs = [
      complete("2026-10-13"),
      complete("2026-10-14"),
      complete("2026-10-15"),
    ];

    expect(prayerStreak(logs, day("2026-10-15"))).toBe(3);
  });

  it("is 0 when the date itself is not complete, however long the run before it", () => {
    const logs = [
      complete("2026-10-13"),
      complete("2026-10-14"),
      partial("2026-10-15"),
    ];

    expect(prayerStreak(logs, day("2026-10-15"))).toBe(0);
  });

  it("is 0 when the date has no Prayer Log", () => {
    expect(prayerStreak([complete("2026-10-14")], day("2026-10-15"))).toBe(0);
  });

  it("stops at an incomplete day", () => {
    const logs = [
      complete("2026-10-12"),
      partial("2026-10-13"),
      complete("2026-10-14"),
      complete("2026-10-15"),
    ];

    expect(prayerStreak(logs, day("2026-10-15"))).toBe(2);
  });

  it("stops at a gap: a day with no Prayer Log", () => {
    const logs = [
      complete("2026-10-11"),
      complete("2026-10-12"),
      complete("2026-10-14"),
      complete("2026-10-15"),
    ];

    expect(prayerStreak(logs, day("2026-10-15"))).toBe(2);
  });

  it("ignores days after the date", () => {
    const logs = [
      complete("2026-10-14"),
      complete("2026-10-15"),
      complete("2026-10-16"),
    ];

    expect(prayerStreak(logs, day("2026-10-15"))).toBe(2);
  });

  it("runs across month and year boundaries, in any log order", () => {
    const logs = [
      complete("2027-01-01"),
      complete("2026-12-30"),
      complete("2026-12-31"),
    ];

    expect(prayerStreak(logs, day("2027-01-01"))).toBe(3);
  });

  it("joins two runs when a missed Salah in the gap between them is logged later", () => {
    let logs = [
      complete("2026-10-12"),
      complete("2026-10-13"),
      partial("2026-10-14"),
      complete("2026-10-15"),
    ];
    expect(prayerStreak(logs, day("2026-10-15"))).toBe(1);

    logs = logs.map((log) =>
      log.date.equals(day("2026-10-14"))
        ? setSalahPerformed(log, "isha", true)
        : log
    );

    expect(prayerStreak(logs, day("2026-10-15"))).toBe(4);
  });

  it("breaks when a Salah on a past day is un-ticked", () => {
    const logs = [
      complete("2026-10-13"),
      complete("2026-10-14"),
      complete("2026-10-15"),
    ].map((log) =>
      log.date.equals(day("2026-10-14"))
        ? setSalahPerformed(log, "fajr", false)
        : log
    );

    expect(prayerStreak(logs, day("2026-10-15"))).toBe(1);
  });
});

describe(setSalahPerformed, () => {
  it("keeps the Salah in the day's order and never twice", () => {
    const log: PrayerLog = { date: day("2026-10-15"), performed: ["isha"] };

    const ticked = setSalahPerformed(
      setSalahPerformed(log, "fajr", true),
      "fajr",
      true
    );

    expect(ticked.performed).toStrictEqual(["fajr", "isha"]);
    expect(setSalahPerformed(ticked, "isha", false).performed).toStrictEqual([
      "fajr",
    ]);
  });
});

describe(canLogDate, () => {
  it("allows today and past dates but no future one", () => {
    const today = day("2026-10-15");

    expect(canLogDate(today, today)).toBeTruthy();
    expect(canLogDate(day("2025-01-01"), today)).toBeTruthy();
    expect(canLogDate(day("2026-10-16"), today)).toBeFalsy();
  });
});
