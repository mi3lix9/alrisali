import { describe, expect, it } from "vitest";

import {
  manualLocation,
  MAX_RECENT_CITIES,
  readRecentCities,
  rememberCity,
} from "./recent-cities";

const cairo = { latitude: 30.0444, longitude: 31.2357, name: "Cairo" };
const tokyo = { latitude: 35.6762, longitude: 139.6503, name: "Tokyo" };

describe(rememberCity, () => {
  it("stores the city with its own time zone, newest first", () => {
    const recent = rememberCity(rememberCity([], cairo), tokyo);
    expect(recent.map((city) => city.name)).toStrictEqual(["Tokyo", "Cairo"]);
    expect(recent.map((city) => city.timeZone)).toStrictEqual([
      "Asia/Tokyo",
      "Africa/Cairo",
    ]);
  });

  it("moves a city chosen again to the top instead of repeating it", () => {
    const recent = rememberCity(rememberCity(rememberCity([], cairo), tokyo), {
      ...cairo,
      latitude: 30.04441,
    });
    expect(recent.map((city) => city.name)).toStrictEqual(["Cairo", "Tokyo"]);
  });

  it("keeps only the most recent cities", () => {
    let recent = rememberCity([], cairo);
    for (let step = 1; step <= MAX_RECENT_CITIES + 2; step += 1) {
      recent = rememberCity(recent, {
        latitude: step * 5,
        longitude: step * 5,
        name: `City ${step}`,
      });
    }
    expect(recent).toHaveLength(MAX_RECENT_CITIES);
    expect(recent[0]?.name).toBe(`City ${MAX_RECENT_CITIES + 2}`);
  });
});

describe(readRecentCities, () => {
  it("is empty for nothing stored or for rubbish", () => {
    expect(readRecentCities(null)).toStrictEqual([]);
    expect(readRecentCities({ nope: 1 })).toStrictEqual([]);
  });

  it("drops entries it cannot read and keeps the rest", () => {
    const stored = [
      { ...tokyo, timeZone: "Asia/Tokyo" },
      { latitude: 999, longitude: 0, name: "Nowhere", timeZone: "UTC" },
    ];
    expect(readRecentCities(stored)).toStrictEqual([stored[0]]);
  });
});

describe(manualLocation, () => {
  it("validates coordinates and resolves their time zone", () => {
    expect(
      manualLocation(" 30.0444 ".trim(), "31.2357", "Cairo")
    ).toStrictEqual({ location: cairo, timeZone: "Africa/Cairo" });
  });

  it("reads Arabic-Indic digits", () => {
    expect(manualLocation("٣٥٫٦٧٦٢", "١٣٩٫٦٥٠٣", "")).toMatchObject({
      location: { latitude: 35.6762, longitude: 139.6503, name: null },
      timeZone: "Asia/Tokyo",
    });
  });

  it("refuses coordinates that are missing or out of range", () => {
    expect(manualLocation("", "10", "")).toBeNull();
    expect(manualLocation("91", "10", "")).toBeNull();
    expect(manualLocation("10", "-181", "")).toBeNull();
    expect(manualLocation("abc", "10", "")).toBeNull();
  });
});
