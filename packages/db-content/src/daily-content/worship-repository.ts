import type { WorshipEntry, WorshipKind } from "@alrisali/domain/daily-content";
import { and, eq } from "drizzle-orm";

import { isMissingTable } from "../shared/content-db";
import type { ContentDb } from "../shared/content-db";
import { worshipMapping } from "./schema";

export interface WorshipMappingRepository {
  /** Every ziyarah, night-dua and every-day entry; none while the replica has never pulled. */
  all: () => Promise<{ kind: string; day: string; supplicationId: string }[]>;
  /** Replaces what a kind lists on a day (the server only; replicas refuse). */
  replace: (
    kind: WorshipKind,
    day: WorshipEntry["day"],
    supplicationIds: readonly string[]
  ) => Promise<void>;
}

export const createWorshipMappingRepository = (
  db: ContentDb
): WorshipMappingRepository => ({
  all: async () => {
    try {
      return await db
        .select({
          kind: worshipMapping.kind,
          day: worshipMapping.day,
          supplicationId: worshipMapping.supplicationId,
        })
        .from(worshipMapping);
    } catch (error) {
      if (isMissingTable(error)) {
        return [];
      }
      throw error;
    }
  },
  replace: async (kind, day, supplicationIds) => {
    // One transaction: a failed insert never leaves the day empty.
    const unique = [...new Set(supplicationIds)];
    const remove = db
      .delete(worshipMapping)
      .where(and(eq(worshipMapping.kind, kind), eq(worshipMapping.day, day)));
    if (unique.length === 0) {
      await db.batch([remove]);
      return;
    }
    await db.batch([
      remove,
      db
        .insert(worshipMapping)
        .values(
          unique.map((supplicationId) => ({ kind, day, supplicationId }))
        ),
    ]);
  },
});
