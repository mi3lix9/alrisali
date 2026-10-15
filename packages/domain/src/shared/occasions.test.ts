import { describe, expect, it } from "vitest";

import {
  allOccasions,
  BUILT_IN_OCCASIONS,
  occasionDetailsSchema,
  occasionSchema,
  occasionsInMonth,
  occasionsOn,
} from "./occasions";
import type { Occasion } from "./occasions";

const ids = (occasions: readonly Occasion[]) =>
  occasions.map((occasion) => occasion.id);

describe("Occasions", () => {
  it("resolves the built-in Occasions of a Hijri Date", () => {
    expect(
      ids(
        occasionsOn({ year: 1448, month: 1, day: 10 }, 30, BUILT_IN_OCCASIONS)
      )
    ).toStrictEqual(["ashura"]);
    expect(
      ids(
        occasionsOn({ year: 1448, month: 2, day: 28 }, 29, BUILT_IN_OCCASIONS)
      )
    ).toStrictEqual(["martyrdom-prophet", "martyrdom-imam-hassan"]);
    expect(
      occasionsOn({ year: 1448, month: 1, day: 2 }, 30, BUILT_IN_OCCASIONS)
    ).toStrictEqual([]);
  });

  it("puts an Occasion on the 30th on the last day of a 29-day month", () => {
    const lastNight: Occasion = {
      id: "last-night",
      month: 9,
      day: 30,
      type: "religious",
      name: { ar: "آخر ليلة", en: "Last night" },
    };

    expect(
      ids(occasionsOn({ year: 1447, month: 9, day: 29 }, 29, [lastNight]))
    ).toStrictEqual(["last-night"]);
    expect(
      ids(occasionsOn({ year: 1448, month: 9, day: 29 }, 30, [lastNight]))
    ).toStrictEqual([]);
  });

  it("lists a month's Occasions in day order", () => {
    const month = occasionsInMonth(9, 30, BUILT_IN_OCCASIONS);

    expect(month.map(({ day }) => day)).toStrictEqual([1, 10, 15, 19, 21, 23]);
    expect(month[0]?.occasions.map((occasion) => occasion.type)).toStrictEqual([
      "celebration",
    ]);
  });

  it("bundles every built-in Occasion valid and named in both languages", () => {
    expect(BUILT_IN_OCCASIONS.length).toBeGreaterThanOrEqual(50);
    for (const occasion of BUILT_IN_OCCASIONS) {
      expect(occasionSchema.parse(occasion)).toStrictEqual(occasion);
    }
    expect(new Set(ids(BUILT_IN_OCCASIONS)).size).toBe(
      BUILT_IN_OCCASIONS.length
    );
  });

  it("shows the Admins' Occasions after the built-in ones of their day", () => {
    const published: Occasion = {
      id: "0b7d6c2e-admin",
      month: 1,
      day: 10,
      type: "religious",
      name: { ar: "مجلس عاشوراء", en: "Ashura gathering night" },
    };
    const occasions = allOccasions([published]);

    expect(occasions).toHaveLength(BUILT_IN_OCCASIONS.length + 1);
    expect(
      ids(occasionsOn({ year: 1448, month: 1, day: 10 }, 30, occasions))
    ).toStrictEqual(["ashura", "0b7d6c2e-admin"]);
    expect(allOccasions([])).toStrictEqual(BUILT_IN_OCCASIONS);
  });

  it("accepts an Admin's Occasion only with a real Hijri day, a type and both names", () => {
    const valid = {
      month: 7,
      day: 13,
      type: "celebration",
      name: { ar: " مولد الإمام علي (ع) ", en: "Birth of Imam Ali (a.s)" },
    };

    expect(occasionDetailsSchema.parse(valid)).toStrictEqual({
      ...valid,
      name: { ar: "مولد الإمام علي (ع)", en: "Birth of Imam Ali (a.s)" },
    });
    for (const invalid of [
      { ...valid, month: 13 },
      { ...valid, month: 0 },
      { ...valid, day: 31 },
      { ...valid, day: 0 },
      { ...valid, day: 1.5 },
      { ...valid, type: "lecture" },
      { ...valid, name: { ar: "  ", en: "Birth" } },
      { ...valid, name: { ar: "مولد", en: "" } },
      { ...valid, name: { ar: "مولد", en: "x".repeat(121) } },
    ]) {
      expect(occasionDetailsSchema.safeParse(invalid).success).toBeFalsy();
    }
  });
});
