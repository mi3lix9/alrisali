import { describe, expect, it } from "vitest";

import { ageBandOf, parseBirthYear } from "./age";

describe(ageBandOf, () => {
  it.each([
    [2009, "under-18"],
    [2008, "18-25"],
    [2001, "18-25"],
    [2000, "26-35"],
    [1976, "36-50"],
    [1975, "over-50"],
  ] as const)("puts someone born in %i in %s in 2026", (year, band) => {
    expect(ageBandOf(year, 2026)).toBe(band);
  });
});

describe(parseBirthYear, () => {
  it("reads a four-digit year up to the current one", () => {
    expect(parseBirthYear(" 1990 ", 2026)).toBe(1990);
    expect(parseBirthYear("2026", 2026)).toBe(2026);
  });

  it.each(["", "abc", "90", "2027", "1899", "1990.5"])(
    "reads %j as no birth year",
    (text) => {
      expect(parseBirthYear(text, 2026)).toBeNull();
    }
  );
});
