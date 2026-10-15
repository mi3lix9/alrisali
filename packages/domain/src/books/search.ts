import type { Book, Passage, SupplicationEntry } from "@alrisali/content/books";

import { normalizeSearchText } from "../shared";

// Search over the Books' Supplications, by title and by text, without
// diacritics. The texts load per Supplication, so the index is built from the
// catalogue alone and gains the texts once they are loaded.

interface IndexedPassage {
  /** As written, to quote under the result. */
  text: string;
  normalized: string;
}

interface IndexedSupplication {
  supplication: SupplicationEntry;
  /** The Arabic and English titles, normalised. */
  titles: string[];
  passages: IndexedPassage[];
}

export type SupplicationSearchIndex = readonly IndexedSupplication[];

/**
 * Every Supplication in `books`, in Book order, with the passages of those
 * whose text is in `texts` (keyed by Supplication id).
 */
export const indexSupplications = (
  books: readonly Book[],
  texts: ReadonlyMap<string, readonly Passage[]> = new Map()
): SupplicationSearchIndex =>
  books.flatMap((book) =>
    book.sections.flatMap((section) =>
      section.supplications.map((summary) => ({
        supplication: { ...summary, bookId: book.id, sectionId: section.id },
        titles: [summary.title.ar, summary.title.en].map(normalizeSearchText),
        passages: (texts.get(summary.id) ?? []).flatMap((passage) =>
          [passage.ar, passage.en ?? ""]
            .filter((text) => text !== "")
            .map((text) => ({ text, normalized: normalizeSearchText(text) }))
        ),
      }))
    )
  );

export interface SupplicationMatch {
  supplication: SupplicationEntry;
  /** The passage the query was found in, as written; absent for a title match. */
  passage?: string;
}

export interface SupplicationSearchResult {
  /** Title matches first, then text matches, each in Book order; at most `limit`. */
  matches: SupplicationMatch[];
  /** Every matching Supplication, beyond the ones listed. */
  total: number;
}

export interface SupplicationSearchOptions {
  /** How many matches to list; 30 by default. */
  limit?: number;
}

/** Supplications whose title or text contains `query`, ignoring diacritics. */
export const searchSupplications = (
  index: SupplicationSearchIndex,
  query: string,
  { limit = 30 }: SupplicationSearchOptions = {}
): SupplicationSearchResult => {
  const needle = normalizeSearchText(query);
  if (!needle) {
    return { matches: [], total: 0 };
  }
  const byTitle: SupplicationMatch[] = [];
  const byText: SupplicationMatch[] = [];
  for (const entry of index) {
    if (entry.titles.some((title) => title.includes(needle))) {
      byTitle.push({ supplication: entry.supplication });
      continue;
    }
    const passage = entry.passages.find((candidate) =>
      candidate.normalized.includes(needle)
    );
    if (passage) {
      byText.push({ supplication: entry.supplication, passage: passage.text });
    }
  }
  return {
    matches: [...byTitle, ...byText].slice(0, limit),
    total: byTitle.length + byText.length,
  };
};
