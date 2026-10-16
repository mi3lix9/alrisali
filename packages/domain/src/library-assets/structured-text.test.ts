import { describe, expect, it } from "vitest";

import { structuredTextBlocks, structuredTextSchema } from "./structured-text";

describe("the structured-text format", () => {
  it("takes sections of passages, English and titles optional", () => {
    expect(
      structuredTextSchema.parse({
        sections: [
          {
            title: { ar: "المقدمة" },
            passages: [{ ar: "بسم الله", en: "In the name of God" }],
          },
          { passages: [{ ar: "الحمد لله" }] },
        ],
      })
    ).toStrictEqual({
      sections: [
        {
          title: { ar: "المقدمة", en: "" },
          passages: [{ ar: "بسم الله", en: "In the name of God" }],
        },
        { title: null, passages: [{ ar: "الحمد لله", en: "" }] },
      ],
    });
  });

  it.each([
    ["no sections", { sections: [] }],
    ["a section without passages", { sections: [{ passages: [] }] }],
    ["a passage without Arabic", { sections: [{ passages: [{ en: "x" }] }] }],
    ["something else", { chapters: [] }],
  ])("refuses %s", (_, json) => {
    expect(structuredTextSchema.safeParse(json).success).toBeFalsy();
  });
});

describe(structuredTextBlocks, () => {
  it("lays the text out as one block per title and passage, numbered from 0", () => {
    const blocks = structuredTextBlocks(
      structuredTextSchema.parse({
        sections: [
          { title: { ar: "أ" }, passages: [{ ar: "١" }, { ar: "٢" }] },
          { passages: [{ ar: "٣" }] },
        ],
      })
    );

    expect(blocks).toStrictEqual([
      { index: 0, type: "title", text: { ar: "أ", en: "" } },
      { index: 1, type: "passage", text: { ar: "١", en: "" } },
      { index: 2, type: "passage", text: { ar: "٢", en: "" } },
      { index: 3, type: "passage", text: { ar: "٣", en: "" } },
    ]);
  });
});
