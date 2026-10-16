import catalog from "./data/catalog.json";
import counters from "./data/counters.json";
import taqibat from "./data/taqibat.json";
import { TEXT_LOADERS } from "./data/texts";
import type { Book, Passage, SupplicationEntry } from "./types";

export type {
  Book,
  BookSection,
  Localized,
  Passage,
  SupplicationEntry,
  SupplicationSummary,
} from "./types";

/** Mafatih al-Jinan, Sahifa Sajjadiyya and Nahj al-Balagha, in display order. */
export const BOOKS: readonly Book[] = catalog.books;

const SUPPLICATIONS: ReadonlyMap<string, SupplicationEntry> = new Map(
  BOOKS.flatMap((book) =>
    book.sections.flatMap((section) =>
      section.supplications.map((supplication) => [
        supplication.id,
        { ...supplication, bookId: book.id, sectionId: section.id },
      ])
    )
  )
);

/** Every Supplication id, in Book order. */
export const SUPPLICATION_IDS: readonly string[] = [...SUPPLICATIONS.keys()];

export const getBook = (id: string): Book | undefined =>
  BOOKS.find((book) => book.id === id);

export const getSupplication = (id: string): SupplicationEntry | undefined =>
  SUPPLICATIONS.get(id);

/** A Supplication's passages, loaded on demand; rejects for an unknown id. */
export const loadSupplicationText = async (
  id: string
): Promise<readonly Passage[]> => {
  const load = TEXT_LOADERS[id];
  if (!load) {
    throw new Error(`Unknown Supplication id: ${id}`);
  }
  const text = await load();
  return text.default;
};

/** In-house Taqibat map: each daily Salah's Supplication, where one is bundled. */
export const TAQIBAT: Readonly<
  Partial<Record<"fajr" | "dhuhr" | "asr" | "maghrib" | "isha", string>>
> = taqibat;
export { AMAL, AMAL_KINDS } from "./data/amal";
export type { AmalEntry, AmalKind } from "./types";

/** A tap counter marked in a bundled text: it sits on the passage that says how many times to repeat. */
export interface PassageCounter {
  /** Index of the passage (from 0) the counter sits under. */
  passage: number;
  /** How many repetitions the text asks for. */
  target: number;
}

const COUNTER_DATA: Readonly<Record<string, readonly PassageCounter[]>> =
  counters;

/**
 * In-house counter marks, only where the bundled text itself says to repeat
 * a phrase; the passage `ar` text stays plain for Recite-Along and search.
 */
export const COUNTERS = COUNTER_DATA;

/** The counters marked in one Supplication, by passage index; empty when none. */
export const countersOf = (id: string): ReadonlyMap<number, PassageCounter> =>
  new Map(
    (COUNTER_DATA[id] ?? []).map((counter) => [counter.passage, counter])
  );
