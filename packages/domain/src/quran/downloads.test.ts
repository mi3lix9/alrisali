import { describe, expect, it } from "vitest";

import {
  createRecitationCache,
  missingAyat,
  recitationFile,
  scopeAyat,
  scopeCoverage,
  scopeJobId,
  withDownloads,
} from ".";
import type { CachedRecitation, RecitationCacheStore } from ".";

const DAY = 24 * 60 * 60 * 1000;

describe(scopeAyat, () => {
  it("lists the 7 ayat of Al-Fatihah", () => {
    expect(scopeAyat({ kind: "surah", surah: 1 })).toStrictEqual([
      "1:1",
      "1:2",
      "1:3",
      "1:4",
      "1:5",
      "1:6",
      "1:7",
    ]);
  });

  it("lists every ayah of the Quran for the whole Quran", () => {
    const all = scopeAyat({ kind: "quran" });
    expect(all).toHaveLength(6236);
    expect(all[0]).toBe("1:1");
    expect(all.at(-1)).toBe("114:6");
  });

  it("splits the Quran into 30 juz with no ayah twice", () => {
    const juz = Array.from({ length: 30 }, (_, i) =>
      scopeAyat({ kind: "juz", juz: i + 1 })
    );
    expect(juz.flat()).toStrictEqual(scopeAyat({ kind: "quran" }));
    expect(juz[0]?.[0]).toBe("1:1");
  });

  it("rejects a juz that does not exist", () => {
    expect(() => scopeAyat({ kind: "juz", juz: 31 })).toThrow(RangeError);
  });
});

describe(recitationFile, () => {
  it("files an ayah under its reciter as sss+aaa", () => {
    expect(recitationFile("ar.alafasy", "2:255")).toStrictEqual({
      key: "ar.alafasy/002255",
      group: "ar.alafasy",
      name: "002255.mp3",
    });
  });
});

describe(scopeCoverage, () => {
  it("counts what a reciter has of a surah", () => {
    const have = new Set(["ar.alafasy/001001", "ar.alafasy/001002"]);
    expect(
      scopeCoverage("ar.alafasy", { kind: "surah", surah: 1 }, have)
    ).toStrictEqual({
      downloaded: 2,
      total: 7,
      complete: false,
    });
  });

  it("does not count another reciter's files", () => {
    const have = new Set(["ar.husary/001001"]);
    expect(
      scopeCoverage("ar.alafasy", { kind: "surah", surah: 1 }, have).downloaded
    ).toBe(0);
  });

  it("is complete when every ayah is there", () => {
    const have = new Set(
      scopeAyat({ kind: "surah", surah: 112 }).map(
        (ayah) => recitationFile("ar.alafasy", ayah).key
      )
    );
    expect(
      scopeCoverage("ar.alafasy", { kind: "surah", surah: 112 }, have).complete
    ).toBeTruthy();
    expect(
      missingAyat("ar.alafasy", { kind: "surah", surah: 112 }, have)
    ).toStrictEqual([]);
  });
});

describe(missingAyat, () => {
  it("leaves out ayat already downloaded", () => {
    const have = new Set(["ar.alafasy/112001"]);
    expect(
      missingAyat("ar.alafasy", { kind: "surah", surah: 112 }, have)
    ).toStrictEqual(["112:2", "112:3", "112:4"]);
  });
});

describe(scopeJobId, () => {
  it("names each reciter's scope apart", () => {
    expect(scopeJobId("ar.alafasy", { kind: "juz", juz: 30 })).toBe(
      "ar.alafasy/juz:30"
    );
    expect(scopeJobId("ar.alafasy", { kind: "quran" })).toBe(
      "ar.alafasy/quran"
    );
  });
});

const setup = (downloaded: Record<string, string>, savedAt: number) => {
  const files = new Map<string, CachedRecitation>([
    [
      "ar.alafasy/001001",
      { key: "ar.alafasy/001001", uri: "file:///cache/1", savedAt },
    ],
  ]);
  const saved: string[] = [];
  const store: RecitationCacheStore = {
    get: (key) => Promise.resolve(files.get(key) ?? null),
    list: () => Promise.resolve([...files.values()]),
    save: (key) => {
      saved.push(key);
      return Promise.resolve();
    },
    remove: (key) => {
      files.delete(key);
      return Promise.resolve();
    },
  };
  const cache = createRecitationCache({ store, now: () => 10 * DAY });
  return {
    files,
    saved,
    cache: withDownloads(cache, {
      uri: (key) => Promise.resolve(downloaded[key] ?? null),
    }),
  };
};

describe(withDownloads, () => {
  it("plays a downloaded ayah from its download, however old the cache is", async () => {
    const { cache } = setup({ "ar.alafasy/001001": "file:///dl/1" }, 0);
    await expect(
      cache.source({ reciter: "ar.alafasy", ayah: "1:1" })
    ).resolves.toBe("file:///dl/1");
  });

  it("streams an ayah that is not downloaded", async () => {
    const { cache } = setup({}, 0);
    await expect(
      cache.source({ reciter: "ar.alafasy", ayah: "1:2" })
    ).resolves.toMatch(/^https:/u);
  });

  it("does not keep a downloaded ayah in the cache again", async () => {
    const { cache, saved } = setup({ "ar.alafasy/001002": "file:///dl/2" }, 0);
    await cache.keep({ reciter: "ar.alafasy", ayah: "1:2" });
    expect(saved).toStrictEqual([]);
    await cache.keep({ reciter: "ar.alafasy", ayah: "1:3" });
    expect(saved).toStrictEqual(["ar.alafasy/001003"]);
  });

  it("prunes only streamed files past 7 days", async () => {
    const { cache, files } = setup({ "ar.alafasy/001001": "file:///dl/1" }, 0);
    await cache.prune();
    expect(files.size).toBe(0);
  });
});
