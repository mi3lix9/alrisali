import { calculatePrayerTimes } from "@alrisali/domain/shared";
import type { PrayerTimesSettings } from "@alrisali/domain/shared";
import { Temporal } from "temporal-polyfill";
import { describe, expect, it } from "vitest";

import { nextPrayerProgress } from "./next-prayer-progress";

const TIME_ZONE = "Asia/Riyadh";
const DAY = Temporal.PlainDate.from("2025-03-10");
const settings: PrayerTimesSettings = {
  coordinates: { latitude: 26.5652, longitude: 50.0124 },
  calculationMethod: "jafari",
  imsakMinutes: 10,
};
const times = calculatePrayerTimes(DAY, TIME_ZONE, settings);
const tomorrow = calculatePrayerTimes(
  DAY.add({ days: 1 }),
  TIME_ZONE,
  settings
);

const at = (time: Temporal.ZonedDateTime | null) => {
  if (!time) {
    throw new Error("expected a Prayer Time");
  }
  return time;
};

describe(nextPrayerProgress, () => {
  it("is halfway between two shown times at their midpoint", () => {
    const hidden = ["imsak", "midnight", "sunset"] as const;
    const fajr = at(times.fajr);
    const sunrise = at(times.sunrise);
    const mid = fajr.add({
      milliseconds: (sunrise.epochMilliseconds - fajr.epochMilliseconds) / 2,
    });
    const progress = nextPrayerProgress(mid.toInstant(), settings, hidden);
    expect(progress?.current?.name).toBe("fajr");
    expect(progress?.next.name).toBe("sunrise");
    expect(progress?.fraction).toBeCloseTo(0.5, 5);
  });

  it("moves on to the next time exactly at a Prayer Time", () => {
    const dhuhr = at(times.dhuhr);
    const progress = nextPrayerProgress(dhuhr.toInstant(), settings, []);
    expect(progress?.current?.name).toBe("dhuhr");
    expect(progress?.next.name).not.toBe("dhuhr");
    expect(progress?.fraction).toBe(0);
    expect(progress?.secondsLeft).toBeGreaterThan(0);
  });

  it("counts down to one second before a time", () => {
    const dhuhr = at(times.dhuhr);
    const progress = nextPrayerProgress(
      dhuhr.subtract({ seconds: 1 }).toInstant(),
      settings,
      []
    );
    expect(progress?.next.name).toBe("dhuhr");
    expect(progress?.secondsLeft).toBe(1);
  });

  it("points to tomorrow's first shown time after the last one today", () => {
    const hidden = ["midnight"] as const;
    const afterIsha = at(times.isha).add({ minutes: 1 });
    const progress = nextPrayerProgress(
      afterIsha.toInstant(),
      settings,
      hidden
    );
    expect(progress?.current?.name).toBe("isha");
    expect(progress?.next.name).toBe("imsak");
    expect(progress?.next.at.epochMilliseconds).toBe(
      at(tomorrow.imsak).epochMilliseconds
    );
    expect(progress?.fraction).toBeGreaterThan(0);
    expect(progress?.fraction).toBeLessThan(1);
  });

  it("skips a hidden next time", () => {
    const afterFajr = at(times.fajr).add({ minutes: 1 });
    const progress = nextPrayerProgress(afterFajr.toInstant(), settings, [
      "sunrise",
    ]);
    expect(progress?.next.name).toBe("dhuhr");
  });

  it("is null when every time is hidden", () => {
    const hidden = [
      "imsak",
      "fajr",
      "sunrise",
      "dhuhr",
      "asr",
      "sunset",
      "maghrib",
      "isha",
      "midnight",
    ] as const;
    expect(
      nextPrayerProgress(at(times.dhuhr).toInstant(), settings, hidden)
    ).toBeNull();
  });
});
