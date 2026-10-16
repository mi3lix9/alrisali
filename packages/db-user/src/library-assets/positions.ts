import { eq } from "drizzle-orm";
import { z } from "zod";

import type { UserDb } from "../shared";
import { libraryAssetPositions } from "./schema";

export interface LibraryAssetPositionsRepository {
  /** Where the Believer stopped in the Library Asset; null if never opened. */
  position: (assetId: string) => Promise<number | null>;
  /** Saves where the Believer is: a page, a second or a block. */
  save: (assetId: string, position: number) => Promise<void>;
}

const positionSchema = z.number().finite().min(0);

export const createLibraryAssetPositionsRepository = (
  db: UserDb,
  now: () => Date = () => new Date()
): LibraryAssetPositionsRepository => ({
  position: async (assetId) => {
    const row = await db
      .select({ position: libraryAssetPositions.position })
      .from(libraryAssetPositions)
      .where(eq(libraryAssetPositions.assetId, assetId))
      .get();
    return row?.position ?? null;
  },
  save: async (assetId, position) => {
    const next = {
      position: positionSchema.parse(position),
      savedAt: now().toISOString(),
    };
    await db
      .insert(libraryAssetPositions)
      .values({ assetId, ...next })
      .onConflictDoUpdate({ target: libraryAssetPositions.assetId, set: next });
  },
});
