import { describe, expect, it } from "vitest";

import {
  FACING_QIBLA_TOLERANCE,
  isFacingQibla,
  KAABA,
  qiblaBearing,
  qiblaDistanceKm,
  qiblaOffset,
} from "./qibla";

// Reference values: WGS84 geodesics from GeographicLib (Geodesic.Inverse to
// the Kaaba). The app uses a sphere, which stays within these tolerances.
const BEARING_TOLERANCE_DEGREES = 0.3;
const DISTANCE_TOLERANCE = 0.005;

const CITIES = [
  {
    name: "London",
    latitude: 51.5074,
    longitude: -0.1278,
    bearing: 118.87,
    km: 4795,
  },
  {
    name: "New York",
    latitude: 40.7128,
    longitude: -74.006,
    bearing: 58.4,
    km: 10_324,
  },
  {
    name: "Toronto",
    latitude: 43.6532,
    longitude: -79.3832,
    bearing: 54.49,
    km: 10_514,
  },
  {
    name: "Jakarta",
    latitude: -6.2088,
    longitude: 106.8456,
    bearing: 295.02,
    km: 7922,
  },
  {
    name: "Sydney",
    latitude: -33.8688,
    longitude: 151.2093,
    bearing: 277.32,
    km: 13_237,
  },
  {
    name: "Najaf",
    latitude: 32.0259,
    longitude: 44.3462,
    bearing: 202,
    km: 1258,
  },
  {
    name: "Tehran",
    latitude: 35.6892,
    longitude: 51.389,
    bearing: 218.54,
    km: 1941,
  },
  {
    name: "Medina",
    latitude: 24.4672,
    longitude: 39.6111,
    bearing: 176.21,
    km: 338,
  },
] as const;

describe(qiblaBearing, () => {
  it.each(CITIES)("points from $name to the Kaaba", (city) => {
    expect(Math.abs(qiblaBearing(city) - city.bearing)).toBeLessThanOrEqual(
      BEARING_TOLERANCE_DEGREES
    );
  });

  it("stays within 0–360°", () => {
    for (const city of CITIES) {
      const bearing = qiblaBearing(city);
      expect(bearing).toBeGreaterThanOrEqual(0);
      expect(bearing).toBeLessThan(360);
    }
  });
});

describe(qiblaDistanceKm, () => {
  it.each(CITIES)("measures from $name to the Kaaba", (city) => {
    expect(
      Math.abs(qiblaDistanceKm(city) - city.km) / city.km
    ).toBeLessThanOrEqual(DISTANCE_TOLERANCE);
  });

  it("is zero at the Kaaba", () => {
    expect(qiblaDistanceKm(KAABA)).toBe(0);
  });
});

describe(qiblaOffset, () => {
  it.each([
    { heading: 100, bearing: 120, offset: 20 },
    { heading: 120, bearing: 100, offset: -20 },
    { heading: 350, bearing: 10, offset: 20 },
    { heading: 10, bearing: 350, offset: -20 },
    { heading: 0, bearing: 180, offset: 180 },
    { heading: 45, bearing: 45, offset: 0 },
  ])(
    "turns $offset° from $heading° to $bearing°, clockwise positive, the short way round",
    ({ heading, bearing, offset }) => {
      expect(qiblaOffset(heading, bearing)).toBe(offset);
    }
  );
});

describe(isFacingQibla, () => {
  it.each([
    { heading: 118, bearing: 119 },
    { heading: 119 + FACING_QIBLA_TOLERANCE, bearing: 119 },
    { heading: 119 - FACING_QIBLA_TOLERANCE, bearing: 119 },
    { heading: 359, bearing: 2 },
  ])(
    "faces $bearing° from $heading° (within the tolerance)",
    ({ heading, bearing }) => {
      expect(isFacingQibla(heading, bearing)).toBeTruthy();
    }
  );

  it.each([
    { heading: 119 + FACING_QIBLA_TOLERANCE + 1, bearing: 119 },
    { heading: 299, bearing: 119 },
  ])("doesn't face $bearing° from $heading°", ({ heading, bearing }) => {
    expect(isFacingQibla(heading, bearing)).toBeFalsy();
  });
});
