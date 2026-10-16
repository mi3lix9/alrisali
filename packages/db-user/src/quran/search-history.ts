import { recordSearch, SEARCH_HISTORY_LIMIT } from "@alrisali/domain/quran";
import { desc, notInArray } from "drizzle-orm";

import type { UserDb } from "../shared";
import { quranSearchHistory } from "./schema";

export interface QuranSearchHistoryRepository {
  /** The last ten searches, latest first. */
  list: () => Promise<string[]>;
  /** Remembers a search; a repeat moves to the top, the eleventh is dropped. */
  record: (query: string) => Promise<void>;
  /** Forgets every search. */
  clear: () => Promise<void>;
}

export const createQuranSearchHistoryRepository = (
  db: UserDb,
  now: () => Date = () => new Date()
): QuranSearchHistoryRepository => {
  const list = async (): Promise<string[]> => {
    const rows = await db
      .select()
      .from(quranSearchHistory)
      .orderBy(desc(quranSearchHistory.searchedAt))
      .limit(SEARCH_HISTORY_LIMIT)
      .all();
    return rows.map((row) => row.query);
  };

  const record = async (query: string) => {
    const kept = recordSearch(await list(), query);
    const [latest] = kept;
    if (latest === undefined) {
      return;
    }
    const searchedAt = now().toISOString();
    await db
      .insert(quranSearchHistory)
      .values({ query: latest, searchedAt })
      .onConflictDoUpdate({
        target: quranSearchHistory.query,
        set: { searchedAt },
      });
    // Drops the eleventh, and a repeat's older spelling.
    await db
      .delete(quranSearchHistory)
      .where(notInArray(quranSearchHistory.query, kept));
  };

  const clear = async () => {
    await db.delete(quranSearchHistory);
  };

  return { list, record, clear };
};
