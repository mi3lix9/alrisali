import { describe, expect, it } from "vitest";

import { FEATURES, featuresByArea, visibleFeatures } from "./features";
import type { FeatureEntry } from "./features";
import type { HijriDate } from "./hijri";
import { TABS } from "./tabs";

// A registry with a seasonal entry for each kind of window: one inside a
// month, and one across the turn of the year.
const REGISTRY = [
  { id: "home", tab: true },
  { id: "quran", area: "quran", shortcut: "shown" },
  {
    id: "imsakiyya",
    area: "seasonal",
    shortcut: "shown",
    window: { start: { month: 9, day: 1 }, end: { month: 9, day: 30 } },
  },
  {
    id: "new-year",
    area: "seasonal",
    shortcut: "hidden",
    window: { start: { month: 12, day: 25 }, end: { month: 1, day: 10 } },
  },
  { id: "tasbih", area: "worship", tab: true, shortcut: "shown" },
] as const satisfies readonly FeatureEntry[];

const ids = (features: readonly FeatureEntry[]) =>
  features.map((feature) => feature.id);

const SHAWWAL_2: HijriDate = { year: 1448, month: 10, day: 2 };
const RAMADAN_1: HijriDate = { year: 1448, month: 9, day: 1 };
const RAMADAN_30: HijriDate = { year: 1448, month: 9, day: 30 };
const MUHARRAM_5: HijriDate = { year: 1449, month: 1, day: 5 };

describe(visibleFeatures, () => {
  it("hides a seasonal feature outside its window", () => {
    expect(ids(visibleFeatures(REGISTRY, SHAWWAL_2))).toStrictEqual([
      "home",
      "quran",
      "tasbih",
    ]);
  });

  it("shows a seasonal feature from the first to the last day of its window", () => {
    expect(ids(visibleFeatures(REGISTRY, RAMADAN_1))).toContain("imsakiyya");
    expect(ids(visibleFeatures(REGISTRY, RAMADAN_30))).toContain("imsakiyya");
  });

  it("shows a feature whose window spans the turn of the year in the new year", () => {
    expect(ids(visibleFeatures(REGISTRY, MUHARRAM_5))).toStrictEqual([
      "home",
      "quran",
      "new-year",
      "tasbih",
    ]);
  });

  it("always shows the app's features that have no window", () => {
    expect(visibleFeatures(FEATURES, SHAWWAL_2)).toHaveLength(
      FEATURES.filter((feature) => !("window" in feature)).length
    );
  });
});

describe(featuresByArea, () => {
  it("groups the visible features by area, leaving out Home and empty areas", () => {
    expect(
      featuresByArea(REGISTRY, SHAWWAL_2).map(({ area, features }) => [
        area,
        ids(features),
      ])
    ).toStrictEqual([
      ["quran", ["quran"]],
      ["worship", ["tasbih"]],
    ]);
  });

  it("adds the seasonal group in season", () => {
    expect(
      featuresByArea(REGISTRY, RAMADAN_1).map(({ area }) => area)
    ).toStrictEqual(["quran", "worship", "seasonal"]);
  });

  it("lists every one of the app's features but Home and the seasonal ones out of season", () => {
    expect(
      featuresByArea(FEATURES, SHAWWAL_2).flatMap(({ features }) =>
        ids(features)
      )
    ).toHaveLength(
      FEATURES.filter((feature) => !("window" in feature)).length - 1
    );
  });
});

const appIds = (today: HijriDate) => ids(visibleFeatures(FEATURES, today));

describe("the Imsakiyya", () => {
  it("is hidden outside its Hijri window", () => {
    expect(appIds(SHAWWAL_2)).not.toContain("imsakiyya");
    expect(appIds({ year: 1448, month: 8, day: 19 })).not.toContain(
      "imsakiyya"
    );
    expect(appIds({ year: 1448, month: 12, day: 10 })).not.toContain(
      "imsakiyya"
    );
  });

  it("shows from 20 Sha'ban to the last day of Ramadan", () => {
    expect(appIds({ year: 1448, month: 8, day: 20 })).toContain("imsakiyya");
    expect(appIds(RAMADAN_1)).toContain("imsakiyya");
    expect(appIds(RAMADAN_30)).toContain("imsakiyya");
  });
});

describe("the tab bar", () => {
  it("has the registry's tab features, in registry order", () => {
    expect(TABS).toStrictEqual([
      "home",
      "prayer",
      "library",
      "worship",
      "tasbih",
    ]);
  });
});
