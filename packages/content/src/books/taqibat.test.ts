import { describe, expect, it } from "vitest";

import { getSupplication, TAQIBAT } from ".";

const DAILY_SALAH = ["fajr", "dhuhr", "asr", "maghrib", "isha"];

describe("Taqibat map integrity", () => {
  it("maps only the five daily Salahs", () => {
    for (const salah of Object.keys(TAQIBAT)) {
      expect(DAILY_SALAH).toContain(salah);
    }
  });

  it("points every Salah at a bundled Supplication", () => {
    for (const id of Object.values(TAQIBAT)) {
      expect(getSupplication(id)?.id).toBe(id);
    }
  });
});
