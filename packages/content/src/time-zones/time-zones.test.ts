import { existsSync, readFileSync } from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

import { timeZoneAt } from ".";
import { CONTENT_SOURCES } from "../sources";

const NOTICE = path.join(
  import.meta.dirname,
  "../../notices/timezone-boundaries.md"
);

describe(timeZoneAt, () => {
  it("gives each city its own IANA time zone", () => {
    const cities = {
      qatif: [26.5652, 50.0124, "Asia/Riyadh"],
      najaf: [32.0259, 44.3462, "Asia/Baghdad"],
      qom: [34.6416, 50.8746, "Asia/Tehran"],
      kuwait: [29.3759, 47.9774, "Asia/Kuwait"],
      manama: [26.2285, 50.586, "Asia/Bahrain"],
      beirut: [33.8938, 35.5018, "Asia/Beirut"],
      london: [51.5074, -0.1278, "Europe/London"],
      dearborn: [42.3223, -83.1763, "America/Detroit"],
      sydney: [-33.8688, 151.2093, "Australia/Sydney"],
    } as const;

    for (const [latitude, longitude, zone] of Object.values(cities)) {
      expect(timeZoneAt(latitude, longitude)).toBe(zone);
    }
  });

  it("gives a nautical zone out at sea", () => {
    expect(timeZoneAt(0, -30)).toBe("Etc/GMT+2");
  });

  it("gives only zones the platform's Intl knows", () => {
    for (const [latitude, longitude] of [
      [64.1466, -21.9426],
      [-90, 0],
      [90, 180],
      [21.4225, 39.8262],
    ] as const) {
      const zone = timeZoneAt(latitude, longitude);
      expect(
        new Intl.DateTimeFormat("en", { timeZone: zone }).resolvedOptions()
          .timeZone
      ).toBeTruthy();
    }
  });
});

describe("time-zone boundaries dataset", () => {
  it("is credited and ships its ODbL notice", () => {
    expect(CONTENT_SOURCES.map(({ id }) => id)).toContain(
      "timezone-boundaries"
    );
    expect(existsSync(NOTICE)).toBeTruthy();
    const notice = readFileSync(NOTICE, "utf-8");
    expect(notice).toContain("ODbL");
    expect(notice).toContain("© OpenStreetMap contributors");
    expect(notice).toContain("CC0");
  });
});
