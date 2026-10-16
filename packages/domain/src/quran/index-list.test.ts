import { describe, expect, it } from "vitest";

import {
  INDEX_TABS,
  quartersByJuz,
  SAVED_FILTERS,
  sortSurahs,
} from "./index-list";

const numbers = (sort: Parameters<typeof sortSurahs>[0], language = "en") =>
  sortSurahs(sort, language).map((surah) => surah.number);

describe("the Quran index", () => {
  it("has Surahs, Juz, Quarters and Saved tabs, Saved filtering ribbons and favorites", () => {
    expect(INDEX_TABS).toStrictEqual(["surahs", "juz", "quarters", "saved"]);
    expect(SAVED_FILTERS).toStrictEqual(["ribbons", "favorites"]);
  });

  it("sorts surahs by mushaf number", () => {
    expect(numbers("number")).toStrictEqual(
      Array.from({ length: 114 }, (_, index) => index + 1)
    );
  });

  it("sorts surahs by revelation order, Al-Alaq first and An-Nasr last", () => {
    const order = numbers("revelation");
    expect(order[0]).toBe(96);
    expect(order.at(-1)).toBe(110);
    expect(new Set(order).size).toBe(114);
  });

  it("sorts surahs by ayat count, Al-Baqarah first, ties by number", () => {
    const order = numbers("ayat");
    expect(order[0]).toBe(2);
    // Al-Kawthar (108) has 3 ayat, as do Al-Asr (103) and An-Nasr (110).
    const shortest = order.slice(-3);
    expect(shortest).toStrictEqual([103, 108, 110]);
  });

  it("sorts surahs alphabetically past their article", () => {
    for (const language of ["ar", "en"]) {
      const order = numbers("alphabet", language);
      expect(new Set(order).size).toBe(114);
      expect(order).not.toStrictEqual(numbers("number"));
    }
    // Al-Mulk files under م, not ا: Taha (ط) comes before it.
    const arabic = numbers("alphabet", "ar");
    expect(arabic.indexOf(20)).toBeLessThan(arabic.indexOf(67));
  });

  it("lists the 240 hizb quarters under their juz, eight to a juz", () => {
    const groups = quartersByJuz();
    expect(groups).toHaveLength(30);
    expect(groups.flatMap((group) => group.quarters)).toHaveLength(240);
    expect(groups[0]?.quarters[0]?.ayah.key).toBe("1:1");
    expect(groups[0]?.quarters[1]).toMatchObject({ hizb: 1, quarter: 1 });
    expect(
      groups.every((group) =>
        group.quarters.every((quarter) => quarter.ayah.juz === group.juz)
      )
    ).toBeTruthy();
  });
});
