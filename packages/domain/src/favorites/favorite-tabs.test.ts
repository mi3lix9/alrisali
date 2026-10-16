import { describe, expect, it } from "vitest";

import { FAVORITE_TABS, favoritesInTab } from "./favorite-tabs";

const AL_KAHF = { kind: "surah", key: "18" } as const;
const AYAT_AL_KURSI = { kind: "ayah", key: "2:255" } as const;
const KUMAYL = { kind: "supplication", key: "mafatih-dua-kumayl" } as const;
const ASSET = { kind: "library-asset", key: "asset-1" } as const;

const NEWEST_FIRST = [AYAT_AL_KURSI, ASSET, KUMAYL, AL_KAHF];

describe("the Favorites tabs", () => {
  it("offers All, Quran and Supplications, in that order", () => {
    expect(FAVORITE_TABS).toStrictEqual(["all", "quran", "supplications"]);
  });
});

describe(favoritesInTab, () => {
  it("lists every Favorite under All, in the order given", () => {
    expect(favoritesInTab(NEWEST_FIRST, "all")).toStrictEqual(NEWEST_FIRST);
  });

  it("lists Surahs and ayat under Quran", () => {
    expect(favoritesInTab(NEWEST_FIRST, "quran")).toStrictEqual([
      AYAT_AL_KURSI,
      AL_KAHF,
    ]);
  });

  it("lists Supplications under Supplications", () => {
    expect(favoritesInTab(NEWEST_FIRST, "supplications")).toStrictEqual([
      KUMAYL,
    ]);
  });

  it("keeps Library materials under All only", () => {
    expect(favoritesInTab([ASSET], "all")).toStrictEqual([ASSET]);
    expect(favoritesInTab([ASSET], "quran")).toStrictEqual([]);
    expect(favoritesInTab([ASSET], "supplications")).toStrictEqual([]);
  });

  it("keeps the extra fields of each Favorite", () => {
    const dated = { ...KUMAYL, favoritedAt: "2026-10-15T12:00:00.000Z" };

    expect(favoritesInTab([dated], "supplications")).toStrictEqual([dated]);
  });
});
