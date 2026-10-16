import { existsSync, readFileSync } from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

import { WORLD_MAGNETIC_MODEL } from ".";
import { CONTENT_SOURCES } from "../sources";

const NOTICE = path.join(import.meta.dirname, "../../notices/wmm.md");
const DEGREE = 12;

describe("World Magnetic Model integrity", () => {
  const { coefficients } = WORLD_MAGNETIC_MODEL;

  it("holds one row for every degree and order up to 12, in order", () => {
    const expected = Array.from({ length: DEGREE }, (_, index) =>
      Array.from({ length: index + 2 }, (__, m) => `${index + 1},${m}`)
    ).flat();
    expect(coefficients.map(([n, m]) => `${n},${m}`)).toStrictEqual(expected);
  });

  it("has no h term or its change at order 0", () => {
    expect(
      coefficients.filter(([, m, , h, , hDot]) => m === 0 && (h || hDot))
    ).toStrictEqual([]);
  });

  it("is dominated by the dipole, as the Earth's field is", () => {
    const dipole = coefficients.find(([n, m]) => n === 1 && m === 0);
    expect(dipole?.[2]).toBeLessThan(-29_000);
  });

  it("is valid for the five years after its epoch", () => {
    expect(WORLD_MAGNETIC_MODEL.validUntil - WORLD_MAGNETIC_MODEL.epoch).toBe(
      5
    );
  });

  it("is credited and ships its public-domain notice", () => {
    expect(CONTENT_SOURCES.map(({ id }) => id)).toContain("wmm");
    expect(existsSync(NOTICE)).toBeTruthy();
    expect(readFileSync(NOTICE, "utf-8")).toContain("public domain");
  });
});
