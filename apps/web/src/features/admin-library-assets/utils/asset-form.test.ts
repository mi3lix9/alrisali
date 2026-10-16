import { describe, expect, it } from "vitest";

import {
  emptyAssetFields,
  structuredTextProblem,
  validateAssetFields,
} from "./asset-form";
import type { AssetFields } from "./asset-form";

const PDF_KEY = "library-asset/0f0f0f0f-0000-4000-8000-000000000000.pdf";
const COVER_KEY = "library-cover/0f0f0f0f-0000-4000-8000-000000000000.jpg";

const filled = (overrides: Partial<AssetFields> = {}): AssetFields => ({
  ...emptyAssetFields("hadith", 3),
  title: { ar: "الكافي", en: "Al-Kafi" },
  kind: "pdf",
  fileKey: PDF_KEY,
  fileSize: 2048,
  coverKey: COVER_KEY,
  ...overrides,
});

describe(emptyAssetFields, () => {
  it("starts a published asset in the category at the given order", () => {
    expect(emptyAssetFields("dua", 2)).toMatchObject({
      category: "dua",
      order: 2,
      published: true,
      fileKey: "",
      coverKey: null,
    });
  });
});

describe(validateAssetFields, () => {
  it("passes a complete asset as the contract's draft", () => {
    const result = validateAssetFields(filled());

    expect(result).toStrictEqual({
      ok: true,
      draft: expect.objectContaining({
        title: { ar: "الكافي", en: "Al-Kafi" },
        category: "hadith",
        order: 3,
        fileKey: PDF_KEY,
        coverKey: COVER_KEY,
        published: true,
      }),
    });
  });

  it("requires an Arabic title", () => {
    const result = validateAssetFields(filled({ title: { ar: "  ", en: "" } }));

    expect(result).toStrictEqual({
      ok: false,
      errors: { "title.ar": "Required" },
    });
  });

  it("asks for a file before there is one", () => {
    const result = validateAssetFields(filled({ fileKey: "", fileSize: 0 }));

    expect(result).toStrictEqual({
      ok: false,
      errors: { fileKey: "Upload the asset's file." },
    });
  });

  it("refuses a file of another kind", () => {
    expect(validateAssetFields(filled({ kind: "audio" }))).toStrictEqual({
      ok: false,
      errors: {
        fileKey: "The file does not match the asset's kind. Upload it again.",
      },
    });
  });

  it.each([Number.NaN, -1, 1.5])("refuses the order %d", (order) => {
    expect(validateAssetFields(filled({ order }))).toStrictEqual({
      ok: false,
      errors: { order: "Enter a whole number, 0 or more" },
    });
  });
});

describe(structuredTextProblem, () => {
  it("accepts a structured text", () => {
    expect(
      structuredTextProblem(
        JSON.stringify({
          sections: [
            {
              title: { ar: "الباب الأول" },
              passages: [{ ar: "نص", en: "Text" }],
            },
            { passages: [{ ar: "نص آخر" }] },
          ],
        })
      )
    ).toBeNull();
  });

  it("explains a file that is not JSON", () => {
    expect(structuredTextProblem("{ sections")).toMatch(/not valid JSON/u);
  });

  it.each([
    ["no sections", {}, "sections"],
    [
      "an empty section",
      { sections: [{ passages: [] }] },
      "sections[0].passages",
    ],
    [
      "a passage without Arabic",
      { sections: [{ passages: [{ en: "Text" }] }] },
      "sections[0].passages[0].ar",
    ],
  ])("names where %s goes wrong", (_, value, where) => {
    const problem = structuredTextProblem(JSON.stringify(value));

    expect(problem).toContain(where);
    expect(problem).toContain('"sections"');
  });
});
