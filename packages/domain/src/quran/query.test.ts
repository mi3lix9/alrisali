import { SURAH_ALIASES, SURAHS } from "@alrisali/content/quran";
import { describe, expect, it } from "vitest";

import { findSurahsByName, parseQuranQuery } from ".";

const keys = (query: string) =>
  parseQuranQuery(query).map((candidate) =>
    candidate.kind === "ayah"
      ? candidate.key
      : `${candidate.kind}:${candidate.value}`
  );

const numbers = (name: string) => findSurahsByName(name).map((s) => s.number);

/** Every spelling that must open 2:255. */
const AYAT_AL_KURSI_QUERIES = [
  "2:255",
  "2.255",
  "٢:٢٥٥",
  "البقرة 255",
  "البقرة:255",
  "٢٥٥ البقرة",
  "255 البقرة",
  "البقره ٢٥٥",
  "baqarah 255",
  "255 Al-Baqarah",
  "بقر 255",
  "baq 255",
];

describe(parseQuranQuery, () => {
  it.each(AYAT_AL_KURSI_QUERIES)("lands on 2:255 from %s", (query) => {
    expect(keys(query)).toStrictEqual(["2:255"]);
    expect(parseQuranQuery(query)[0]?.target).toStrictEqual({ ayah: "2:255" });
  });

  it("offers a number as page, Surah, juz and hizb candidates within range", () => {
    expect(keys("2")).toStrictEqual(["page:2", "surah:2", "juz:2", "hizb:2"]);
    expect(keys("٣٠")).toStrictEqual([
      "page:30",
      "surah:30",
      "juz:30",
      "hizb:30",
    ]);
    expect(keys("61")).toStrictEqual(["page:61", "surah:61"]);
    expect(keys("115")).toStrictEqual(["page:115"]);
    expect(keys("604")).toStrictEqual(["page:604"]);
  });

  it("offers nothing for a number outside every range", () => {
    expect(keys("605")).toStrictEqual([]);
    expect(keys("0")).toStrictEqual([]);
  });

  it("opens a juz or hizb at its first ayah", () => {
    const targets = Object.fromEntries(
      parseQuranQuery("2").map((candidate) => [
        candidate.kind,
        candidate.target,
      ])
    );
    expect(targets).toStrictEqual({
      page: { page: 2 },
      surah: { surah: 2 },
      juz: { ayah: "2:142" },
      hizb: { ayah: "2:75" },
    });
  });

  it("offers a Surah name or its start as that Surah", () => {
    expect(keys("البقرة")).toStrictEqual(["surah:2"]);
    expect(keys("بقر")).toStrictEqual(["surah:2"]);
    expect(keys("kahf")).toStrictEqual(["surah:18"]);
    expect(keys("yaseen")).toStrictEqual(["surah:36"]);
    expect(keys("الن")).toContain("surah:114");
  });

  it("offers nothing for an ayah or Surah that does not exist", () => {
    expect(keys("2:287")).toStrictEqual([]);
    expect(keys("115:1")).toStrictEqual([]);
    expect(keys("البقرة 287")).toStrictEqual([]);
    expect(keys("zzzz")).toStrictEqual([]);
    expect(keys("   ")).toStrictEqual([]);
  });
});

describe(findSurahsByName, () => {
  it("folds hamza, ta marbuta, alef maqsura and waw hamza in names", () => {
    expect(numbers("الأعلى")).toStrictEqual([87]);
    expect(numbers("الاعلي")).toStrictEqual([87]);
    expect(numbers("المؤمنون")).toStrictEqual([23]);
    expect(numbers("المومنون")).toStrictEqual([23]);
    expect(numbers("آل عمران")).toStrictEqual([3]);
  });

  it("resolves each bundled alias to its own Surah only", () => {
    const wrong = Object.entries(SURAH_ALIASES).flatMap(([number, aliases]) =>
      aliases
        .filter((alias) => numbers(alias).join(",") !== String(Number(number)))
        .map((alias) => ({ number, alias, found: numbers(alias) }))
    );
    expect(wrong).toStrictEqual([]);
  });

  it("resolves every Surah's own name to it alone", () => {
    const wrong = SURAHS.filter(
      (surah) =>
        numbers(surah.nameAr).join(",") !== String(surah.number) ||
        numbers(surah.nameEn).join(",") !== String(surah.number)
    );
    expect(wrong).toStrictEqual([]);
  });
});
