import { describe, expect, it } from "vitest";

import { favoriteId, favoriteItemSchema } from "./favorite-item";

describe("favourite items", () => {
  it("accepts each kind with its own key", () => {
    const items = [
      { kind: "surah", key: "18" },
      { kind: "ayah", key: "2:255" },
      { kind: "supplication", key: "mafatih-dua-kumayl" },
      { kind: "library-asset", key: "0198f0a2-7c3e-7b41-9f00-3c2a1d4e5f60" },
    ];

    for (const item of items) {
      expect(favoriteItemSchema.parse(item)).toStrictEqual(item);
    }
  });

  it("rejects a Surah or ayah outside the Quran", () => {
    for (const item of [
      { kind: "surah", key: "0" },
      { kind: "surah", key: "115" },
      { kind: "surah", key: "2:255" },
      { kind: "ayah", key: "115:1" },
      { kind: "ayah", key: "2:0" },
      { kind: "ayah", key: "2" },
    ]) {
      expect(favoriteItemSchema.safeParse(item).success).toBeFalsy();
    }
  });

  it("rejects an empty key and a kind it does not know", () => {
    expect(
      favoriteItemSchema.safeParse({ kind: "supplication", key: " " }).success
    ).toBeFalsy();
    expect(
      favoriteItemSchema.safeParse({ kind: "book", key: "mafatih" }).success
    ).toBeFalsy();
  });

  it("gives the same item the same id on every device", () => {
    expect(favoriteId({ kind: "ayah", key: "2:255" })).toBe("ayah:2:255");
    expect(favoriteId({ kind: "surah", key: "2" })).not.toBe(
      favoriteId({ kind: "ayah", key: "2:255" })
    );
  });
});
