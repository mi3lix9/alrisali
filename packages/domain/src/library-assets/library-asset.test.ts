import { describe, expect, it } from "vitest";

import {
  libraryAssetKindOf,
  libraryAssetSchema,
  libraryShelves,
} from "./library-asset";
import type { LibraryAsset } from "./library-asset";

const UUID = "0b6c3f4e-9d1a-4c8e-8a57-3f2d1e0c9b7a";

const asset = (
  overrides: Partial<LibraryAsset> & { id: string }
): LibraryAsset => ({
  title: { ar: "كتاب", en: "" },
  author: { ar: "", en: "" },
  description: { ar: "", en: "" },
  category: "general",
  kind: "pdf",
  fileKey: `library-asset/${UUID}.pdf`,
  fileSize: 1024,
  coverKey: null,
  order: 0,
  ...overrides,
});

const ids = (assets: readonly LibraryAsset[]) => assets.map(({ id }) => id);

describe(libraryAssetKindOf, () => {
  it.each([
    ["library-asset/x.pdf", "pdf"],
    ["library-asset/x.mp3", "audio"],
    ["library-asset/x.m4a", "audio"],
    ["library-asset/x.mp4", "video"],
    ["library-asset/x.json", "text"],
  ] as const)("reads %s as %s", (key, kind) => {
    expect(libraryAssetKindOf(key)).toBe(kind);
  });

  it("knows no kind for a file a Library Asset cannot be", () => {
    expect(libraryAssetKindOf("library-asset/x.exe")).toBeNull();
  });
});

describe("a Library Asset", () => {
  it("takes a Library Asset whose file is of its kind", () => {
    const audio = asset({
      id: "a",
      kind: "audio",
      fileKey: `library-asset/${UUID}.mp3`,
    });

    expect(libraryAssetSchema.parse(audio)).toStrictEqual(audio);
  });

  it("refuses a Library Asset whose file is of another kind", () => {
    expect(
      libraryAssetSchema.safeParse(
        asset({ id: "a", kind: "video", fileKey: `library-asset/${UUID}.pdf` })
      ).success
    ).toBeFalsy();
  });

  it("refuses a file or cover that was not uploaded as one", () => {
    expect(
      libraryAssetSchema.safeParse(
        asset({ id: "a", fileKey: `speaker-photo/${UUID}.pdf` })
      ).success
    ).toBeFalsy();
    expect(
      libraryAssetSchema.safeParse(
        asset({ id: "a", coverKey: `library-asset/${UUID}.png` })
      ).success
    ).toBeFalsy();
  });
});

describe(libraryShelves, () => {
  it("groups Library Assets by category in the Library's order, each in the Admins' order", () => {
    const shelves = libraryShelves([
      asset({ id: "history-2", category: "history", order: 2 }),
      asset({ id: "dua", category: "dua" }),
      asset({ id: "history-1", category: "history", order: 1 }),
      asset({ id: "quran", category: "quran" }),
    ]);

    expect(
      shelves.map(({ category, assets }) => [category, ids(assets)])
    ).toStrictEqual([
      ["quran", ["quran"]],
      ["dua", ["dua"]],
      ["history", ["history-1", "history-2"]],
    ]);
  });

  it("orders Library Assets of the same order by Arabic title", () => {
    const [shelf] = libraryShelves([
      asset({ id: "b", title: { ar: "ب", en: "" } }),
      asset({ id: "a", title: { ar: "أ", en: "" } }),
    ]);

    expect(ids(shelf?.assets ?? [])).toStrictEqual(["a", "b"]);
  });
});
