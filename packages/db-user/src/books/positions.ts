import { desc, eq, gt } from "drizzle-orm";
import { z } from "zod";

import type { UserDb } from "../shared";
import { supplicationPositions } from "./schema";

export interface SupplicationPosition {
  /** The passage index, from 0. */
  section: number;
  savedAt: Date;
}

export interface SupplicationPositionsRepository {
  /** Where the Believer stopped in the Supplication; null if never saved. */
  position: (supplicationId: string) => Promise<SupplicationPosition | null>;
  /**
   * The Supplication the Believer stopped in most recently, past its first
   * section (so there is something to continue); null if none.
   */
  latest: () => Promise<
    (SupplicationPosition & { supplicationId: string }) | null
  >;
  /** Saves the section the Believer reached. */
  save: (supplicationId: string, section: number) => Promise<void>;
}

const sectionSchema = z.number().int().min(0);

export const createSupplicationPositionsRepository = (
  db: UserDb,
  now: () => Date = () => new Date()
): SupplicationPositionsRepository => ({
  position: async (supplicationId) => {
    const row = await db
      .select({
        section: supplicationPositions.section,
        savedAt: supplicationPositions.savedAt,
      })
      .from(supplicationPositions)
      .where(eq(supplicationPositions.supplicationId, supplicationId))
      .get();
    return row
      ? { section: row.section, savedAt: new Date(row.savedAt) }
      : null;
  },
  latest: async () => {
    const row = await db
      .select({
        supplicationId: supplicationPositions.supplicationId,
        section: supplicationPositions.section,
        savedAt: supplicationPositions.savedAt,
      })
      .from(supplicationPositions)
      .where(gt(supplicationPositions.section, 0))
      .orderBy(desc(supplicationPositions.savedAt))
      .limit(1)
      .get();
    return row
      ? {
          supplicationId: row.supplicationId,
          section: row.section,
          savedAt: new Date(row.savedAt),
        }
      : null;
  },
  save: async (supplicationId, section) => {
    const next = {
      section: sectionSchema.parse(section),
      savedAt: now().toISOString(),
    };
    await db
      .insert(supplicationPositions)
      .values({ supplicationId, ...next })
      .onConflictDoUpdate({
        target: supplicationPositions.supplicationId,
        set: next,
      });
  },
});
