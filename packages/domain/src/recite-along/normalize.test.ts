import { describe, expect, it } from "vitest";

import { tokenizeText } from "./normalize";

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
