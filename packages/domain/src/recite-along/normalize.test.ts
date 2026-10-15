import { describe, expect, it } from "vitest";

import { normalizeArabic, tokenizeText } from "./normalize";

describe("Arabic normalisation", () => {
  it("strips diacritics", () => {
    expect(normalizeArabic("الْحَمْدُ لِلَّهِ")).toBe("الحمد لله");
  });

  it("unifies alef forms", () => {
    expect(normalizeArabic("أَإِآٱ")).toBe("اااا");
  });

  it("turns taa marbuta into haa", () => {
    expect(normalizeArabic("رَحْمَة")).toBe("رحمه");
  });

  it("turns alef maqsura into yaa", () => {
    expect(normalizeArabic("عَلَى")).toBe("علي");
  });

  it("unifies hamza seats", () => {
    expect(normalizeArabic("مُؤْمِن سَيِّئَة")).toBe("مومن سييه");
  });

  it("strips tatweel", () => {
    expect(normalizeArabic("الرحمـــن")).toBe("الرحمن");
  });

  it("strips punctuation", () => {
    expect(normalizeArabic("«الحمد، لله؛»")).toBe("الحمد لله");
  });

  it("strips the right-to-left mark speech transcripts begin with", () => {
    expect(normalizeArabic("\u200Fالحمد لله")).toBe("الحمد لله");
  });
});

describe("tokenising a text for Recite-Along", () => {
  const text = "الْحَمْدُ لِلَّهِ رَبِّ الْعالَمِينَ\n\nوَصَلَّى اللهُ عَلَيْهِ (1)";
  const tokenized = tokenizeText(text);

  it("keeps lines, with an empty line as a paragraph gap", () => {
    expect(tokenized.lines).toHaveLength(3);
    expect(tokenized.lines[1]).toStrictEqual([]);
  });

  it("lists the normalised Arabic words in order", () => {
    expect(tokenized.words).toStrictEqual([
      "الحمد",
      "لله",
      "رب",
      "العالمين",
      "وصلي",
      "الله",
      "عليه",
    ]);
  });

  it("shows digits and stray punctuation but never matches them", () => {
    expect(tokenized.lines[2]?.at(-1)).toStrictEqual({
      text: "(1)",
      wordIndex: null,
      wordsBefore: 7,
    });
  });

  it("counts the words before each token", () => {
    expect(tokenized.lines[2]?.[0]).toStrictEqual({
      text: "وَصَلَّى",
      wordIndex: 4,
      wordsBefore: 4,
    });
  });
});
