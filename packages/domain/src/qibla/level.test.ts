import { describe, expect, it } from "vitest";

import {
  LEVEL_TOLERANCE_DEGREES,
  levelFromAcceleration,
  needsCompassCalibration,
} from "./level";

const tiltedBy = (degrees: number, axis: "x" | "y") => {
  const radians = (degrees * Math.PI) / 180;
  return {
    x: 0,
    y: 0,
    z: Math.cos(radians),
    [axis]: Math.sin(radians),
  };
};

describe(levelFromAcceleration, () => {
  it("calls a phone lying flat level, the bubble in the middle", () => {
    expect(levelFromAcceleration({ x: 0, y: 0, z: 1 })).toStrictEqual({
      tilt: 0,
      bubble: { x: 0, y: 0 },
      level: true,
    });
  });

  it("stays level within the tolerance and not past it", () => {
    expect(
      levelFromAcceleration(tiltedBy(LEVEL_TOLERANCE_DEGREES - 0.5, "x")).level
    ).toBeTruthy();
    expect(
      levelFromAcceleration(tiltedBy(LEVEL_TOLERANCE_DEGREES + 0.5, "x")).level
    ).toBeFalsy();
  });

  it("reports how far from flat the phone is", () => {
    expect(levelFromAcceleration(tiltedBy(10, "y")).tilt).toBeCloseTo(10, 5);
  });

  it("floats the bubble to the high side", () => {
    // Top edge raised: the reading gains +y; right edge raised: +x.
    expect(levelFromAcceleration(tiltedBy(8, "y")).bubble.y).toBeGreaterThan(0);
    expect(levelFromAcceleration(tiltedBy(-8, "y")).bubble.y).toBeLessThan(0);
    expect(levelFromAcceleration(tiltedBy(8, "x")).bubble.x).toBeGreaterThan(0);
  });

  it("keeps the bubble inside its circle however far the phone tips", () => {
    const { bubble } = levelFromAcceleration({ x: 1, y: -1, z: 0 });
    expect(bubble).toStrictEqual({ x: 1, y: -1 });
  });

  it("calls a phone lying face down upside down, not level", () => {
    const upsideDown = levelFromAcceleration({ x: 0, y: 0, z: -1 });
    expect(upsideDown.tilt).toBeCloseTo(180, 5);
    expect(upsideDown.level).toBeFalsy();
  });

  it("calls a reading with no force level, as there is no tilt to show", () => {
    expect(levelFromAcceleration({ x: 0, y: 0, z: 0 }).level).toBeTruthy();
  });
});

describe(needsCompassCalibration, () => {
  it("asks for a figure-eight when the compass reports low accuracy", () => {
    expect(needsCompassCalibration(0)).toBeTruthy();
    expect(needsCompassCalibration(1)).toBeTruthy();
  });

  it("stays quiet when the compass is accurate enough", () => {
    expect(needsCompassCalibration(2)).toBeFalsy();
    expect(needsCompassCalibration(3)).toBeFalsy();
  });
});
