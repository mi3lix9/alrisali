// The bundled KFGQPC Hafs mushaf (ADR-0004): 604 Quran Pages of the Madinah
// layout, every ayah verbatim, and surah and juz metadata. The font ships as
// `@alrisali/content/quran/font.ttf`; the notice as `KFGQPC_NOTICE`.
import { HAFS } from "./data/hafs";

export const PAGE_COUNT = 604;
export const SURAH_COUNT = 114;

/** `surah:ayah`, e.g. `2:255`. */
export type AyahKey = `${number}:${number}`;

export interface Surah {
  number: number;
  nameAr: string;
  nameEn: string;
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
  | { kind: "surah-header"; surah: number }
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
  ([nameAr, nameEn], index) => ({ number: index + 1, nameAr, nameEn })
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
      return { kind: "surah-header", surah: row[1] };
    }
    if (row[0] === "b") {
      return { kind: "basmala", surah: row[1], text: row[2] };
    }
    return { kind: "ayah", words: allWords().slice(row[0], row[1] + 1) };
  });
  const firstAyah = AYAT.find((ayah) => ayah.page === page);
  return { number: page, juz: firstAyah?.juz ?? 1, lines };
};
