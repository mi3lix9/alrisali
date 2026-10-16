import type { Book, Passage } from "@alrisali/content/books";
import { describe, expect, it } from "vitest";

import { indexSupplications, searchSupplications } from "./search";

const BOOKS: Book[] = [
  {
    id: "mafatih",
    title: { ar: "مفاتيح الجنان", en: "Mafatih al-Jinan" },
    source: "test",
    sourceUrl: "https://example.org",
    sections: [
      {
        id: "duas",
        title: { ar: "الأدعية", en: "Supplications" },
        supplications: [
          {
            id: "mafatih-kumayl",
            title: { ar: "دُعَاءُ كُمَيْل", en: "Du'a Kumayl" },
          },
          {
            id: "mafatih-sabah",
            title: { ar: "دعاء الصباح", en: "Supplication of the Morning" },
          },
        ],
      },
    ],
  },
  {
    id: "sahifa",
    title: { ar: "الصحيفة السجادية", en: "Al-Sahifa al-Sajjadiyya" },
    source: "test",
    sourceUrl: "https://example.org",
    sections: [
      {
        id: "main",
        title: { ar: "الأدعية", en: "Supplications" },
        supplications: [
          {
            id: "sahifa-1",
            number: 1,
            title: { ar: "في التحميد لله", en: "In Praise of God" },
          },
        ],
      },
    ],
  },
];

const TEXTS = new Map<string, Passage[]>([
  ["mafatih-sabah", [{ ar: "اَللّـٰهُمَّ يا مَنْ دَلَعَ لِسانَ الصَّباحِ بِنُطْقِ تَبَلُّجِهِ" }]],
  [
    "sahifa-1",
    [
      {
        ar: "اَلْحَمْدُ لِلّٰهِ الْأَوَّلِ بِلا أَوَّلٍ كانَ قَبْلَهُ",
        en: "Praise belongs to God, the First, without a first before Him",
      },
    ],
  ],
]);

const ids = (query: string, texts = TEXTS) =>
  searchSupplications(indexSupplications(BOOKS, texts), query).matches.map(
    (match) => match.supplication.id
  );

describe(searchSupplications, () => {
  it("finds a Supplication by its title typed without diacritics", () => {
    expect(ids("دعاء كميل")).toStrictEqual(["mafatih-kumayl"]);
  });

  it("finds a Supplication by its English title", () => {
    expect(ids("dua kumayl")).toStrictEqual(["mafatih-kumayl"]);
  });

  it("finds a Supplication by its text, quoting the passage", () => {
    const { matches } = searchSupplications(
      indexSupplications(BOOKS, TEXTS),
      "دلع لسان الصباح"
    );
    expect(matches).toHaveLength(1);
    expect(matches[0]).toMatchObject({
      supplication: { id: "mafatih-sabah", bookId: "mafatih" },
      passage: "اَللّـٰهُمَّ يا مَنْ دَلَعَ لِسانَ الصَّباحِ بِنُطْقِ تَبَلُّجِهِ",
    });
  });

  it("matches text with hamza and alef forms typed bare", () => {
    expect(ids("الحمد لله الاول بلا اول")).toStrictEqual(["sahifa-1"]);
  });

  it("finds English text, quoting the English passage", () => {
    const { matches } = searchSupplications(
      indexSupplications(BOOKS, TEXTS),
      "without a first"
    );
    expect(matches.map((match) => match.passage)).toStrictEqual([
      "Praise belongs to God, the First, without a first before Him",
    ]);
  });

  it("lists title matches before text matches", () => {
    expect(ids("الصباح")).toStrictEqual(["mafatih-sabah"]);
    expect(ids("praise")).toStrictEqual(["sahifa-1"]);
    expect(ids("دعاء")).toStrictEqual(["mafatih-kumayl", "mafatih-sabah"]);
  });

  it("searches titles alone until the texts are indexed", () => {
    expect(ids("دلع لسان", new Map())).toStrictEqual([]);
    expect(ids("كميل", new Map())).toStrictEqual(["mafatih-kumayl"]);
  });

  it("caps the matches it lists but counts them all", () => {
    const result = searchSupplications(indexSupplications(BOOKS, TEXTS), "ل", {
      limit: 1,
    });
    expect(result.matches).toHaveLength(1);
    expect(result.total).toBe(3);
  });

  it("finds nothing for an empty query", () => {
    expect(ids("  ")).toStrictEqual([]);
  });
});
