import type { ManagedLibraryAsset } from "@alrisali/api/library-assets";
import { describe, expect, it } from "vitest";

import { formatFileSize, nextOrder } from "./library-table";

const asset = (
  id: string,
  overrides: Partial<ManagedLibraryAsset> = {}
): ManagedLibraryAsset => ({
  id,
  title: { ar: `عنوان ${id}`, en: "" },
  author: { ar: "", en: "" },
  description: { ar: "", en: "" },
  category: "general",
  kind: "pdf",
  fileKey: "library-asset/00000000-0000-0000-0000-000000000000.pdf",
  fileSize: 1,
  coverKey: null,
  order: 0,
  published: true,
  ...overrides,
});

describe(nextOrder, () => {
  it("is 0 for an empty category", () => {
    expect(
      nextOrder([asset("a", { category: "quran", order: 4 })], "dua")
    ).toBe(0);
  });

  it("is one past the largest order in the category", () => {
    expect(
      nextOrder(
        [
          asset("a", { category: "dua", order: 4 }),
          asset("b", { category: "dua", order: 1 }),
          asset("c", { category: "fiqh", order: 9 }),
        ],
        "dua"
      )
    ).toBe(5);
  });
});

describe(formatFileSize, () => {
  it.each([
    [0, "0 B"],
    [512, "512 B"],
    [1024, "1 KiB"],
    [1536, "1.5 KiB"],
    [5 * 1024 * 1024, "5 MiB"],
    [Math.round(2.25 * 1024 * 1024 * 1024), "2.3 GiB"],
  ])("writes %i bytes as %s", (bytes, text) => {
    expect(formatFileSize(bytes)).toBe(text);
  });
});
