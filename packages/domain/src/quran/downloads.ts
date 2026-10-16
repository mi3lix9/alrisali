import { AYAT } from "@alrisali/content/quran";

import { ayatOfSurah, JUZ_COUNT, SURAH_COUNT } from "./mushaf";
import type { AyahKey } from "./mushaf";
import { cacheKey } from "./recitation";
import type { RecitationCache } from "./recitation";

// Recitation the Believer downloads on purpose: one reciter's audio by
// surah, by juz or the whole Quran. Downloaded files live apart from the
// 7-day cache, are played in preference to a stream, and are never pruned.

export type DownloadScope =
  | { kind: "surah"; surah: number }
  | { kind: "juz"; juz: number }
  | { kind: "quran" };

/** Every ayah a scope covers, in mushaf order. */
export const scopeAyat = (scope: DownloadScope): AyahKey[] => {
  if (scope.kind === "surah") {
    return ayatOfSurah(scope.surah).map((ayah) => ayah.key);
  }
  if (scope.kind === "juz") {
    if (
      !(Number.isInteger(scope.juz) && scope.juz >= 1 && scope.juz <= JUZ_COUNT)
    ) {
      throw new RangeError(`No Juz ${scope.juz}; juz run 1–${JUZ_COUNT}`);
    }
    return AYAT.filter((ayah) => ayah.juz === scope.juz).map(
      (ayah) => ayah.key
    );
  }
  return AYAT.map((ayah) => ayah.key);
};

/** Every surah and juz scope, then the whole Quran, for the picker. */
export const surahScopes = (): DownloadScope[] =>
  Array.from({ length: SURAH_COUNT }, (_, index) => ({
    kind: "surah",
    surah: index + 1,
  }));
export const juzScopes = (): DownloadScope[] =>
  Array.from({ length: JUZ_COUNT }, (_, index) => ({
    kind: "juz",
    juz: index + 1,
  }));

/** Names one reciter's scope, e.g. `ar.alafasy/surah:2`; also a download job's id. */
export const scopeJobId = (reciter: string, scope: DownloadScope): string => {
  if (scope.kind === "surah") {
    return `${reciter}/surah:${scope.surah}`;
  }
  return scope.kind === "juz"
    ? `${reciter}/juz:${scope.juz}`
    : `${reciter}/quran`;
};

/** A downloaded ayah's place on the device: a folder per reciter, `<sss><aaa>.mp3` in it. */
export const recitationFile = (
  reciter: string,
  ayah: AyahKey
): { key: string; group: string; name: string } => {
  const key = cacheKey({ reciter, ayah });
  return { key, group: reciter, name: `${key.slice(reciter.length + 1)}.mp3` };
};

/** The key a stored file `<reciter>/<name>.mp3` stands for. */
export const recitationFileKey = (group: string, name: string): string =>
  `${group}/${name.replace(/\.mp3$/u, "")}`;

export interface ScopeCoverage {
  downloaded: number;
  total: number;
  complete: boolean;
}

/** How much of a scope one reciter has on the device; `have` holds file keys. */
export const scopeCoverage = (
  reciter: string,
  scope: DownloadScope,
  have: ReadonlySet<string>
): ScopeCoverage => {
  const ayat = scopeAyat(scope);
  const downloaded = ayat.filter((ayah) =>
    have.has(cacheKey({ reciter, ayah }))
  ).length;
  return {
    downloaded,
    total: ayat.length,
    complete: downloaded === ayat.length,
  };
};

/** The ayat of a scope still to download for a reciter. */
export const missingAyat = (
  reciter: string,
  scope: DownloadScope,
  have: ReadonlySet<string>
): AyahKey[] =>
  scopeAyat(scope).filter((ayah) => !have.has(cacheKey({ reciter, ayah })));

export interface DownloadedRecitations {
  /** Where a downloaded ayah's file is, or null when it is not downloaded. */
  uri: (key: string) => Promise<string | null>;
}

/**
 * The cache with downloads in front: a downloaded ayah plays from its file
 * whatever its age, is not kept again, and `prune` only ever touches the
 * cache, never a download.
 */
export const withDownloads = (
  cache: RecitationCache,
  downloads: DownloadedRecitations
): RecitationCache => ({
  source: async (recited) =>
    (await downloads.uri(cacheKey(recited))) ?? cache.source(recited),
  keep: async (recited) => {
    if (!(await downloads.uri(cacheKey(recited)))) {
      await cache.keep(recited);
    }
  },
  prune: cache.prune,
});
