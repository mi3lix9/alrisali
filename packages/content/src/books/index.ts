import catalog from "./data/catalog.json";
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

export { AMAL, AMAL_KINDS } from "./data/amal";
export type { AmalEntry, AmalKind } from "./types";
