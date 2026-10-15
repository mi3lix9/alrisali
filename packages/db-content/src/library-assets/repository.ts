import {
  libraryAssetSchema,
  sortLibraryAssets,
} from "@alrisali/domain/library-assets";
import type { LibraryAsset } from "@alrisali/domain/library-assets";
import { eq, or } from "drizzle-orm";

import { isMissingTable } from "../shared/content-db";
import type { ContentDb } from "../shared/content-db";
import { libraryAssets } from "./schema";

type LibraryAssetRow = typeof libraryAssets.$inferSelect;

export interface LibraryAssetsRepository {
  /**
   * Every published Library Asset in the Admins' order; empty while a
   * device's replica has never pulled. A row an older app cannot read (a kind
   * or category added later) is left out rather than failing the rest.
   */
  list: () => Promise<LibraryAsset[]>;
  asset: (id: string) => Promise<LibraryAsset | null>;
  /** Whether a published Library Asset uses the file as its file or cover. */
  publishes: (key: string) => Promise<boolean>;
  /** Writes (the server only; replicas refuse). */
  save: (asset: LibraryAsset) => Promise<void>;
  remove: (id: string) => Promise<void>;
}

const toAsset = (row: LibraryAssetRow): LibraryAsset | null => {
  const parsed = libraryAssetSchema.safeParse({
    id: row.id,
    title: { ar: row.titleAr, en: row.titleEn },
    author: { ar: row.authorAr, en: row.authorEn },
    description: { ar: row.descriptionAr, en: row.descriptionEn },
    category: row.category,
    kind: row.kind,
    fileKey: row.fileKey,
    fileSize: row.fileSize,
    coverKey: row.coverKey,
    order: row.displayOrder,
  });
  return parsed.success ? parsed.data : null;
};

const toRow = (asset: LibraryAsset): LibraryAssetRow => ({
  id: asset.id,
  titleAr: asset.title.ar,
  titleEn: asset.title.en,
  authorAr: asset.author.ar,
  authorEn: asset.author.en,
  descriptionAr: asset.description.ar,
  descriptionEn: asset.description.en,
  category: asset.category,
  kind: asset.kind,
  fileKey: asset.fileKey,
  fileSize: asset.fileSize,
  coverKey: asset.coverKey,
  displayOrder: asset.order,
});

/** No rows while the table does not exist yet (a never-pulled replica). */
const orEmpty = async <T>(read: () => Promise<T[]>): Promise<T[]> => {
  try {
    return await read();
  } catch (error) {
    if (isMissingTable(error)) {
      return [];
    }
    throw error;
  }
};

export const createLibraryAssetsRepository = (
  db: ContentDb
): LibraryAssetsRepository => ({
  list: async () => {
    const rows = await orEmpty(() => db.select().from(libraryAssets));
    return sortLibraryAssets(
      rows.flatMap((row) => {
        const asset = toAsset(row);
        return asset ? [asset] : [];
      })
    );
  },
  asset: async (id) => {
    const rows = await orEmpty(() =>
      db.select().from(libraryAssets).where(eq(libraryAssets.id, id))
    );
    return rows[0] ? toAsset(rows[0]) : null;
  },
  publishes: async (key) => {
    const rows = await orEmpty(() =>
      db
        .select({ id: libraryAssets.id })
        .from(libraryAssets)
        .where(
          or(eq(libraryAssets.fileKey, key), eq(libraryAssets.coverKey, key))
        )
        .limit(1)
    );
    return rows.length > 0;
  },
  save: async (asset) => {
    const row = toRow(asset);
    await db
      .insert(libraryAssets)
      .values(row)
      .onConflictDoUpdate({ target: libraryAssets.id, set: row });
  },
  remove: async (id) => {
    await db.delete(libraryAssets).where(eq(libraryAssets.id, id));
  },
});
