import { describe, expect, it } from "vitest";

import {
  BUILT_IN_OCCASIONS,
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
});
