import {
  HIZB_QUARTER_STARTS,
  SURAH_ALIASES,
  SURAHS,
} from "@alrisali/content/quran";
import type { AyahKey, Surah } from "@alrisali/content/quran";

import { normalizeArabic } from "../shared";
import { writeDigits } from "../shared/digits";
import { findAyah, firstAyahOfJuz, isPage, isSurah, JUZ_COUNT } from "./mushaf";
import type { JumpTarget } from "./reader";

// One box for everything the Believer may type to get somewhere in the
// mushaf: a number (a page, Surah, juz or hizb), "2:255", a Surah name with an
// ayah number in either order, or the start of a Surah name.

/** Arabic-Indic digits, as the ayah numbers inside the text. */
const ARABIC_DIGITS = /[\u0660-\u0669]/gu;

/** Quran text and queries as bare letters, ayah numbers left out. */
export const bareQuranText = (text: string): string =>
  normalizeArabic(text.replaceAll(ARABIC_DIGITS, ""));

/** Latin as lowercase letters and digits: "Al-Fātiḥah" is "alfatihah". */
export const normalizeLatin = (text: string): string =>
  text
    .normalize("NFD")
    .toLowerCase()
    .replaceAll(/[^a-z0-9]/gu, "");

/** "ال" with the space an Arabic name may put after it ("آل عمران"). */
const ARABIC_ARTICLE = /^\u0627\u0644 ?(?=\S)/u;
/** Transliterated article, with its sun-letter assimilations: "Ash-Shams". */
const LATIN_ARTICLE = /^(?:Al|An|Ar|As|At|Az|Ad|Ash|Adh|Aṣ|Aṭ|Aḍ)-(?=\S)/u;

/** How a text is compared: Arabic as bare letters, Latin as plain letters. */
const keysOf = (text: string): string[] =>
  [bareQuranText(text), normalizeLatin(text)].filter(Boolean);

const surahKeys = (surah: Surah): Set<string> => {
  const keys = new Set<string>();
  for (const key of keysOf(surah.nameAr)) {
    keys.add(key);
    keys.add(key.replace(ARABIC_ARTICLE, ""));
  }
  keys.add(normalizeLatin(surah.nameEn));
  keys.add(normalizeLatin(surah.nameEn.replace(LATIN_ARTICLE, "")));
  for (const alias of SURAH_ALIASES[surah.number] ?? []) {
    for (const key of keysOf(alias)) {
      keys.add(key);
    }
  }
  keys.delete("");
  return keys;
};

const surahIndex = SURAHS.map((surah) => ({ surah, keys: surahKeys(surah) }));

/**
 * The Surahs a typed name points at, without diacritics or letter forms, with
 * or without "ال": those it names exactly if any, else those whose name or
 * alias it begins, else those that contain it.
 */
export const findSurahsByName = (name: string): Surah[] => {
  const queries = keysOf(name);
  if (queries.length === 0) {
    return [];
  }
  const tiers = [
    (key: string, query: string) => key === query,
    (key: string, query: string) => key.startsWith(query),
    (key: string, query: string) => key.includes(query),
  ];
  for (const matches of tiers) {
    const found = surahIndex
      .filter(({ keys }) =>
        queries.some((query) => [...keys].some((key) => matches(key, query)))
      )
      .map(({ surah }) => surah);
    if (found.length > 0) {
      return found;
    }
  }
  return [];
};

/** A place the typed query may mean, with where opening it jumps. */
export type QuranQueryCandidate =
  | {
      kind: "page" | "surah" | "juz" | "hizb";
      /** The page, Surah, juz or hizb number. */
      value: number;
      target: JumpTarget;
    }
  | {
      kind: "ayah";
      surah: number;
      ayah: number;
      key: AyahKey;
      target: JumpTarget;
    };

/** The order a bare number's candidates are offered in. */
export const QURAN_QUERY_KINDS = [
  "page",
  "surah",
  "juz",
  "hizb",
  "ayah",
] as const;

const HIZB_COUNT = 60;
const QUARTERS_PER_HIZB = 4;

const ayahCandidate = (
  surah: number,
  ayah: number
): QuranQueryCandidate | undefined => {
  const found = findAyah(`${surah}:${ayah}`);
  return found
    ? {
        kind: "ayah",
        surah,
        ayah,
        key: found.key,
        target: { ayah: found.key },
      }
    : undefined;
};

const numberCandidates = (value: number): QuranQueryCandidate[] => {
  const found: QuranQueryCandidate[] = [];
  if (isPage(value)) {
    found.push({ kind: "page", value, target: { page: value } });
  }
  if (isSurah(value)) {
    found.push({ kind: "surah", value, target: { surah: value } });
  }
  if (Number.isInteger(value) && value >= 1 && value <= JUZ_COUNT) {
    found.push({
      kind: "juz",
      value,
      target: { ayah: firstAyahOfJuz(value).key },
    });
  }
  const hizbStart = HIZB_QUARTER_STARTS[(value - 1) * QUARTERS_PER_HIZB];
  if (
    Number.isInteger(value) &&
    value >= 1 &&
    value <= HIZB_COUNT &&
    hizbStart
  ) {
    found.push({ kind: "hizb", value, target: { ayah: hizbStart } });
  }
  return found;
};

const nameCandidates = (name: string, ayah?: number): QuranQueryCandidate[] =>
  findSurahsByName(name).flatMap((surah): QuranQueryCandidate[] => {
    if (ayah === undefined) {
      return [
        { kind: "surah", value: surah.number, target: { surah: surah.number } },
      ];
    }
    const candidate = ayahCandidate(surah.number, ayah);
    return candidate ? [candidate] : [];
  });

const AYAH_REFERENCE = /^(?<surah>\d+)\s*[:.]\s*(?<ayah>\d+)$/u;
const NUMBER = /^\d+$/u;
const SEPARATORS = String.raw`[\s:.\-]*`;
const NAME_THEN_NUMBER = new RegExp(
  String.raw`^(?<name>.*?[^\d\s:.\-])${SEPARATORS}(?<number>\d+)$`,
  "u"
);
const NUMBER_THEN_NAME = new RegExp(
  String.raw`^(?<number>\d+)${SEPARATORS}(?<name>[^\d\s:.\-].*)$`,
  "u"
);

/**
 * What a query typed into the Quran search box may mean, in the order to
 * offer it: a number as a page, Surah, juz and hizb within range; "2:255" as
 * that ayah; a Surah name (or its start) alone as the Surah, and with an ayah
 * number on either side ("البقرة 255", "255 البقرة") as that ayah. Nothing
 * for a query that names no place; ayah text is `searchQuran`'s work.
 */
export const parseQuranQuery = (query: string): QuranQueryCandidate[] => {
  const text = writeDigits(query, "latin").trim().replaceAll(/\s+/gu, " ");
  if (!text) {
    return [];
  }
  if (NUMBER.test(text)) {
    return numberCandidates(Number(text));
  }
  const reference = AYAH_REFERENCE.exec(text);
  if (reference?.groups) {
    const candidate = ayahCandidate(
      Number(reference.groups["surah"]),
      Number(reference.groups["ayah"])
    );
    return candidate ? [candidate] : [];
  }
  const match = NAME_THEN_NUMBER.exec(text) ?? NUMBER_THEN_NAME.exec(text);
  if (match?.groups) {
    return nameCandidates(
      match.groups["name"] ?? "",
      Number(match.groups["number"])
    );
  }
  return nameCandidates(text);
};
