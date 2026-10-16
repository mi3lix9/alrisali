import { Temporal } from "temporal-polyfill";
import { describe, expect, it } from "vitest";

import { magneticDeclination } from "./declination";
import { trueHeading } from "./qibla";

// NOAA's own check values, from WMM2025_TEST_VALUES.txt in WMM2025COF.zip
// (https://www.ncei.noaa.gov/products/world-magnetic-model). 2027.5 is taken
// as 2 July 2027; the declination moves under 0.001° in that half day.
const NOAA_TEST_VALUES = [
  { date: "2025-01-01", height: 0, latitude: 80, longitude: 0, d: 1.28 },
  { date: "2025-01-01", height: 0, latitude: 0, longitude: 120, d: -0.16 },
  { date: "2025-01-01", height: 0, latitude: -80, longitude: 240, d: 68.78 },
  { date: "2025-01-01", height: 100, latitude: 80, longitude: 0, d: 0.85 },
  { date: "2025-01-01", height: 100, latitude: 0, longitude: 120, d: -0.15 },
  { date: "2025-01-01", height: 100, latitude: -80, longitude: 240, d: 68.21 },
  { date: "2027-07-02", height: 0, latitude: 80, longitude: 0, d: 2.59 },
  { date: "2027-07-02", height: 0, latitude: 0, longitude: 120, d: -0.24 },
  { date: "2027-07-02", height: 0, latitude: -80, longitude: 240, d: 68.49 },
  { date: "2027-07-02", height: 100, latitude: 80, longitude: 0, d: 2.16 },
  { date: "2027-07-02", height: 100, latitude: 0, longitude: 120, d: -0.23 },
  { date: "2027-07-02", height: 100, latitude: -80, longitude: 240, d: 67.93 },
] as const;
/** The test values are given to two decimals. */
const TEST_VALUE_TOLERANCE = 0.01;

// NOAA's Magnetic Field Calculator (WMM-2025, sea level) for 15 October 2026
// (https://www.ngdc.noaa.gov/geomag/calculators/magcalc.shtml#declination).
const PLACES = [
  { name: "London", latitude: 51.5074, longitude: -0.1278, d: 1.21094 },
  { name: "New York", latitude: 40.7128, longitude: -74.006, d: -12.46302 },
  { name: "Najaf", latitude: 32.0259, longitude: 44.3462, d: 4.5599 },
  { name: "Sydney", latitude: -33.8688, longitude: 151.2093, d: 12.82689 },
  { name: "Mecca", latitude: 21.4225, longitude: 39.8262, d: 3.50185 },
  { name: "Qatif", latitude: 26.5652, longitude: 50.0122, d: 3.01754 },
] as const;
const CALCULATOR_TOLERANCE = 0.005;
const OCTOBER_15 = Temporal.PlainDate.from("2026-10-15");

describe(magneticDeclination, () => {
  it.each(NOAA_TEST_VALUES)(
    "matches NOAA's check value at $latitude°, $longitude°, $height km on $date",
    ({ date, height, latitude, longitude, d }) => {
      const declination = magneticDeclination(
        { latitude, longitude },
        Temporal.PlainDate.from(date),
        height
      );
      expect(Math.abs(declination - d)).toBeLessThanOrEqual(
        TEST_VALUE_TOLERANCE
      );
    }
  );

  it.each(PLACES)(
    "matches NOAA's calculator in $name on 15 October 2026",
    (place) => {
      expect(
        Math.abs(magneticDeclination(place, OCTOBER_15) - place.d)
      ).toBeLessThanOrEqual(CALCULATOR_TOLERANCE);
    }
  );

  it("is east (positive) in Najaf and west (negative) in New York", () => {
    expect(magneticDeclination(PLACES[2], OCTOBER_15)).toBeGreaterThan(0);
    expect(magneticDeclination(PLACES[1], OCTOBER_15)).toBeLessThan(0);
  });
});

describe(trueHeading, () => {
  it.each([
    { magnetic: 100, declination: 4.5, heading: 104.5 },
    { magnetic: 100, declination: -12.5, heading: 87.5 },
    { magnetic: 358, declination: 4, heading: 2 },
    { magnetic: 3, declination: -5, heading: 358 },
  ])(
    "turns magnetic $magnetic° with declination $declination° into true $heading°",
    ({ magnetic, declination, heading }) => {
      expect(trueHeading(magnetic, declination)).toBeCloseTo(heading, 10);
    }
  );
});
