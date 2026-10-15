// Shape of the generated Hafs dataset (data/hafs.ts), written by
// scripts/quran/build.ts. Tuples keep the bundle compact.

/** [Arabic name, English name] */
export type SurahRow = readonly [string, string];

/** [surah, ayah, juz, page, KFGQPC first line, KFGQPC last line, text] */
export type AyahRow = readonly [
  number,
  number,
  number,
  number,
  number,
  number,
  string,
];

/**
 * One line of a Quran Page:
 * - `["h", surah]` the surah header band
 * - `["b", surah, text]` the basmala, as KFGQPC typeset it
 * - `[first, last]` words `first..last` (inclusive) of the whole Quran, where
 *   the words are every ayah's text split on spaces, in order
 */
export type LineRow =
  | readonly ["h", number]
  | readonly ["b", number, string]
  | readonly [number, number];

/** Every surah header band reads "سُورَةُ" then the surah's Arabic name. */
export const SURAH_HEADER_PREFIX = "سُورَةُ ";

export interface HafsDataset {
  source: {
    release: string;
    url: string;
    zipSha256: string;
    /** SHA-256 of every source ayah text joined with "\n". */
    textSha256: string;
  };
  /** The KFGQPC notice that ships with the data and the font. */
  notice: string;
  surahs: readonly SurahRow[];
  ayat: readonly AyahRow[];
  /** Index 0 is page 1. */
  pages: readonly (readonly LineRow[])[];
}
