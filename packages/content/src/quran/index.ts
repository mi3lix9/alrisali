// The bundled KFGQPC Hafs mushaf (ADR-0004): 604 Quran Pages of the Madinah
// layout, every ayah verbatim, and surah, juz and hizb-quarter metadata. The
// font ships as `@alrisali/content/quran/font.ttf`; the notice as
// `KFGQPC_NOTICE`.
import { HAFS } from "./data/hafs";
import { REVELATION } from "./data/revelation";
import { SURAH_HEADER_PREFIX } from "./dataset";

export const PAGE_COUNT = 604;
export const SURAH_COUNT = 114;
/** 60 hizb, each of four quarters (rub' al-hizb); a juz holds two hizb. */
export const HIZB_QUARTER_COUNT = 240;

/** `surah:ayah`, e.g. `2:255`. */
export type AyahKey = `${number}:${number}`;

/**
 * The first ayah of each hizb quarter, in order (Tanzil Quran Metadata,
 * CC BY 3.0, corrected to KFGQPC's ۞ signs; notices/tanzil.md).
 */
export { HIZB_QUARTER_STARTS } from "./data/hizb";

/** Other names and spellings of each Surah (in-house), by Surah number. */
export { SURAH_ALIASES } from "./data/surah-aliases";

export interface Surah {
  number: number;
  nameAr: string;
  nameEn: string;
  /** Where the surah was revealed (Tanzil Quran Metadata, CC BY 3.0). */
  revelationPlace: "meccan" | "medinan";
  /** 1 for the first surah revealed, 114 for the last (Tanzil's order). */
  revelationOrder: number;
}

export interface Ayah {
  key: AyahKey;
  surah: number;
  ayah: number;
  juz: number;
  page: number;
  /** First and last line KFGQPC gives for the ayah on its page. */
  lineStart: number;
  lineEnd: number;
  /** Verbatim KFGQPC text, ending in the ayah-end sign and its number. */
  text: string;
}

export interface QuranWord {
  surah: number;
  ayah: number;
  text: string;
  /** The ayah-end sign with the ayah's number (the rosette). */
  isAyahEnd: boolean;
}

export type QuranLine =
  /** `text` is the band's title as KFGQPC sets it: "سُورَةُ" and the name. */
  | { kind: "surah-header"; surah: number; text: string }
  | { kind: "basmala"; surah: number; text: string }
  | { kind: "ayah"; words: QuranWord[] };

export interface QuranPage {
  number: number;
  /** Juz of the page's first ayah. */
  juz: number;
  /** 15 lines; the centred opening pages 1 and 2 have 8. */
  lines: QuranLine[];
}

export const KFGQPC_NOTICE = HAFS.notice;
export const QURAN_SOURCE = HAFS.source;

export const SURAHS: readonly Surah[] = HAFS.surahs.map(
  ([nameAr, nameEn], index) => ({
    number: index + 1,
    nameAr,
    nameEn,
    revelationPlace: REVELATION[index]?.[0] ?? "meccan",
    revelationOrder: REVELATION[index]?.[1] ?? index + 1,
  })
);

export const AYAT: readonly Ayah[] = HAFS.ayat.map(
  ([surah, ayah, juz, page, lineStart, lineEnd, text]) => ({
    key: `${surah}:${ayah}`,
    surah,
    ayah,
    juz,
    page,
    lineStart,
    lineEnd,
    text,
  })
);

let words: QuranWord[] | undefined;
/** Every word of the Quran in order; line ranges index into it. */
const allWords = (): QuranWord[] => {
  words ??= AYAT.flatMap(({ surah, ayah, text }) => {
    const tokens = text.split(" ");
    return tokens.map((token, index) => ({
      surah,
      ayah,
      text: token,
      isAyahEnd: index === tokens.length - 1,
    }));
  });
  return words;
};

export const getQuranPage = (page: number): QuranPage => {
  const rows = HAFS.pages[page - 1];
  if (!(Number.isInteger(page) && rows)) {
    throw new RangeError(`No Quran Page ${page}; pages run 1–${PAGE_COUNT}`);
  }
  const lines = rows.map((row): QuranLine => {
    if (row[0] === "h") {
      const name = HAFS.surahs[row[1] - 1]?.[0] ?? "";
      return {
        kind: "surah-header",
        surah: row[1],
        text: `${SURAH_HEADER_PREFIX}${name}`,
      };
    }
    if (row[0] === "b") {
      return { kind: "basmala", surah: row[1], text: row[2] };
    }
    return { kind: "ayah", words: allWords().slice(row[0], row[1] + 1) };
  });
  const firstAyah = AYAT.find((ayah) => ayah.page === page);
  return { number: page, juz: firstAyah?.juz ?? 1, lines };
};

/** The sajdah ayat, obligatory (the four 'azaa'im) or recommended. */
export { SAJDAH } from "./data/sajdah";
export type { Sajdah, SajdahKind } from "./data/sajdah";
