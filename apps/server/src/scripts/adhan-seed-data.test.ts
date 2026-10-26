import { adhanCatalogueEntrySchema } from "@alrisali/domain/shared";
import { describe, expect, it } from "vitest";

import { ADHAN_SEED_VOICES, seedKey } from "./adhan-seed-data";

describe("the seed Adhan voices", () => {
  it("make valid catalogue entries with stable keys of their own cut", () => {
    for (const voice of ADHAN_SEED_VOICES) {
      const entry = {
        id: voice.id,
        name: voice.name,
        credit: voice.credit,
        full: { key: seedKey(voice, "full"), seconds: 1, bytes: 1 },
        takbir: { key: seedKey(voice, "takbir"), seconds: 1, bytes: 1 },
      };
      expect(adhanCatalogueEntrySchema.safeParse(entry).success).toBeTruthy();
      expect(seedKey(voice, "full")).toBe(entry.full.key);
    }
  });

  it("keep every recording under its own key", () => {
    const keys = ADHAN_SEED_VOICES.flatMap((voice) => [
      seedKey(voice, "full"),
      seedKey(voice, "takbir"),
    ]);
    expect(new Set(keys).size).toBe(keys.length);
  });
});
