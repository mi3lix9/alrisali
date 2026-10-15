import { describe, expect, it } from "vitest";

import { distanceKm } from "./location";

const NAJAF = { latitude: 32.0259, longitude: 44.3462 };
const KARBALA = { latitude: 32.616, longitude: 44.0249 };

describe(distanceKm, () => {
  it("measures the great-circle distance between two places", () => {
    expect(distanceKm(NAJAF, KARBALA)).toBeCloseTo(72.5, 0);
    expect(distanceKm(KARBALA, NAJAF)).toBeCloseTo(distanceKm(NAJAF, KARBALA));
  });

  it("is zero for the same place", () => {
    expect(distanceKm(NAJAF, NAJAF)).toBe(0);
  });
});
