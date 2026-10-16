import { describe, expect, it } from "vitest";

import { qiblaBearing, qiblaDistanceKm } from "./qibla";
import {
  DEFAULT_QIBLA_TARGET,
  QIBLA_TARGET_IDS,
  isShrine,
  qiblaTargetSchema,
  targetBearing,
  targetDistanceKm,
} from "./targets";

// Reference values: great-circle bearings and distances (spherical earth,
// R = 6371.0088 km) from Qatif and London to each Shrine's coordinates,
// computed independently of the app's code with the haversine and forward-
// azimuth formulas. The app's sphere agrees to the digits shown.
const BEARING_TOLERANCE_DEGREES = 0.3;
const DISTANCE_TOLERANCE = 0.002;

const QATIF = { latitude: 26.5565, longitude: 50.0089 };
const LONDON = { latitude: 51.5074, longitude: -0.1278 };

const FROM_QATIF = [
  { target: "najaf", bearing: 318.96, km: 818.78 },
  { target: "karbala", bearing: 320.82, km: 887.33 },
  { target: "mashhad", bearing: 37.7, km: 1413.22 },
  { target: "madina", bearing: 259.73, km: 1068.64 },
  { target: "kadhimiya", bearing: 325.64, km: 934.47 },
  { target: "samarra", bearing: 326.81, km: 1033.19 },
  { target: "kaaba", bearing: 243.26, km: 1180.85 },
] as const;

const FROM_LONDON = [
  { target: "najaf", bearing: 103.64, km: 4188.29 },
  { target: "karbala", bearing: 103.18, km: 4121.16 },
  { target: "mashhad", bearing: 85.85, km: 4923.01 },
  { target: "madina", bearing: 116.49, km: 4509.2 },
  { target: "kadhimiya", bearing: 101.97, km: 4083.35 },
  { target: "samarra", bearing: 101.4, km: 3989.88 },
] as const;

describe("Qibla targets", () => {
  it("offers the Kaaba and the six Shrines, the Kaaba first and default", () => {
    expect(QIBLA_TARGET_IDS).toStrictEqual([
      "kaaba",
      "najaf",
      "karbala",
      "mashhad",
      "madina",
      "kadhimiya",
      "samarra",
    ]);
    expect(DEFAULT_QIBLA_TARGET).toBe("kaaba");
  });

  it("calls only the Kaaba the Qibla, not a Shrine", () => {
    expect(isShrine("kaaba")).toBeFalsy();
    expect(isShrine("najaf")).toBeTruthy();
  });

  it("rejects a target it doesn't know", () => {
    expect(qiblaTargetSchema.safeParse("atlantis").success).toBeFalsy();
  });

  it.each([
    { place: "Qatif", from: QATIF, references: FROM_QATIF },
    { place: "London", from: LONDON, references: FROM_LONDON },
  ])(
    "points from $place to each target as the references do",
    ({ from, references }) => {
      for (const { target, bearing, km } of references) {
        expect(
          Math.abs(targetBearing(from, target) - bearing),
          `${target} bearing`
        ).toBeLessThan(BEARING_TOLERANCE_DEGREES);
        expect(
          Math.abs(targetDistanceKm(from, target) / km - 1),
          `${target} distance`
        ).toBeLessThan(DISTANCE_TOLERANCE);
      }
    }
  );

  it("gives the Kaaba the same bearing and distance as the Qibla", () => {
    expect(targetBearing(QATIF, "kaaba")).toBe(qiblaBearing(QATIF));
    expect(targetDistanceKm(QATIF, "kaaba")).toBe(qiblaDistanceKm(QATIF));
  });

  it("puts Najaf about 75 km from Karbala, standing at Karbala's shrine", () => {
    const karbala = { latitude: 32.6164, longitude: 44.0322 };
    expect(targetDistanceKm(karbala, "karbala")).toBeCloseTo(0, 3);
    const km = targetDistanceKm(karbala, "najaf");
    expect(km).toBeGreaterThan(70);
    expect(km).toBeLessThan(80);
  });
});
