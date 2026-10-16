import { describe, expect, it } from "vitest";

import {
  FACING_QIBLA_DEGREES,
  KAABA,
  NEAR_QIBLA_DEGREES,
  qiblaAlignment,
  qiblaBearing,
  qiblaDistanceKm,
  qiblaOffset,
  smoothHeading,
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

describe(qiblaAlignment, () => {
  it("counts within 5° as facing and within 15° as near", () => {
    expect(FACING_QIBLA_DEGREES).toBe(5);
    expect(NEAR_QIBLA_DEGREES).toBe(15);
  });

  it.each([
    { heading: 119, bearing: 119, alignment: "facing" },
    { heading: 124, bearing: 119, alignment: "facing" },
    { heading: 114, bearing: 119, alignment: "facing" },
    { heading: 358, bearing: 2, alignment: "facing" },
    { heading: 125, bearing: 119, alignment: "near" },
    { heading: 104, bearing: 119, alignment: "near" },
    { heading: 350, bearing: 4, alignment: "near" },
    { heading: 135, bearing: 119, alignment: "away" },
    { heading: 299, bearing: 119, alignment: "away" },
  ] as const)(
    "is $alignment at $heading° for a Qibla at $bearing°",
    ({ heading, bearing, alignment }) => {
      expect(qiblaAlignment(heading, bearing)).toBe(alignment);
    }
  );
});

describe(smoothHeading, () => {
  it("starts from the first reading", () => {
    expect(smoothHeading(null, 120)).toBe(120);
  });

  it("moves part of the way towards a new reading", () => {
    const smoothed = smoothHeading(100, 120);
    expect(smoothed).toBeGreaterThan(100);
    expect(smoothed).toBeLessThan(120);
  });

  it.each([
    { previous: 359, reading: 1 },
    { previous: 350, reading: 10 },
  ])(
    "crosses north from $previous° to $reading° the short way",
    ({ previous, reading }) => {
      const smoothed = smoothHeading(previous, reading, 0.5);
      expect(qiblaOffset(previous, smoothed)).toBeGreaterThan(0);
      expect(qiblaOffset(previous, smoothed)).toBeLessThanOrEqual(
        qiblaOffset(previous, reading)
      );
      expect(smoothed).toBeCloseTo(
        (previous + qiblaOffset(previous, reading) / 2) % 360,
        10
      );
    }
  );

  it("crosses north from 1° to 359° the short way, anticlockwise", () => {
    expect(smoothHeading(1, 359, 0.5)).toBeCloseTo(0, 10);
  });

  it("settles on a steady reading", () => {
    let heading: number | null = 300;
    for (let step = 0; step < 50; step += 1) {
      heading = smoothHeading(heading, 10);
    }
    expect(Math.abs(qiblaOffset(heading ?? 0, 10))).toBeLessThan(0.1);
  });

  it("stays within 0–360°", () => {
    for (const [previous, reading] of [
      [359, 1],
      [1, 359],
      [180, 0],
    ] as const) {
      const smoothed = smoothHeading(previous, reading);
      expect(smoothed).toBeGreaterThanOrEqual(0);
      expect(smoothed).toBeLessThan(360);
    }
  });
});
