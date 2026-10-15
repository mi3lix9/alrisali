import { describe, expect, it } from "vitest";

import type { LibraryAsset } from "./library-asset";
import { searchLibraryAssets } from "./search";

const asset = (
  id: string,
  title: LibraryAsset["title"],
  order = 0
): LibraryAsset => ({
  id,
  title,
  author: { ar: "", en: "" },
  description: { ar: "", en: "" },
  category: "general",
  kind: "pdf",
  fileKey: `library-asset/${id}.pdf`,
  fileSize: 1024,
  coverKey: null,
  order,
});

const ASSETS = [
  asset("salah", { ar: "أَحْكَامُ الصَّلَاةِ", en: "Rulings of Prayer" }, 2),
  asset("ashura", { ar: "زيارة عاشوراء", en: "" }, 1),
  asset("musa", { ar: "قصة موسى", en: "The Story of Mūsā" }, 3),
];

const ids = (query: string) =>
  searchLibraryAssets(ASSETS, query).map(({ id }) => id);

describe(searchLibraryAssets, () => {
  it("finds a vocalised title typed without diacritics or hamza", () => {
    expect(ids("احكام الصلاه")).toStrictEqual(["salah"]);
  });

  it("finds a title typed with ta marbuta as ha and ya for alef maqsura", () => {
    expect(ids("زياره")).toStrictEqual(["ashura"]);
    expect(ids("موسي")).toStrictEqual(["musa"]);
  });

  it("finds the English title, ignoring case and accents", () => {
    expect(ids("story of musa")).toStrictEqual(["musa"]);
    expect(ids("PRAYER")).toStrictEqual(["salah"]);
  });

  it("lists matches in the Admins' order", () => {
    expect(ids("ا")).toStrictEqual(["ashura", "salah"]);
  });

  it("finds nothing for an empty query", () => {
    expect(ids(" ")).toStrictEqual([]);
  });
});
