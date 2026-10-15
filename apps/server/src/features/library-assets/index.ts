import { randomUUID } from "node:crypto";

import { managedLibraryAssetSchema } from "@alrisali/api/library-assets";
import type { ManagedLibraryAsset } from "@alrisali/api/library-assets";
import { createLibraryAssetsRepository } from "@alrisali/db-content/library-assets";
import { libraryAsset } from "@alrisali/db-server/schema/library-assets";
import { structuredTextSchema } from "@alrisali/domain/library-assets";
import { ORPCError } from "@orpc/server";
import { asc, eq } from "drizzle-orm";

import type { Context } from "@/context";
import type { ContentDatabase } from "@/shared/lib/content-database";
import type { FileBucket } from "@/shared/lib/file-bucket";
import { admin } from "@/shared/lib/orpc";

type Row = typeof libraryAsset.$inferSelect;

const toAsset = (row: Row): ManagedLibraryAsset =>
  managedLibraryAssetSchema.parse({
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
    published: row.published,
  });

const toRow = (asset: ManagedLibraryAsset) => ({
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
  published: asset.published,
  updatedAt: new Date(),
});

/**
 * Copies the Library Asset to the content database devices pull while it is
 * published, and takes it out of there when it is not. The server's row is
 * written first: a failed copy is repaired by saving again.
 */
const publish = async (
  content: ContentDatabase,
  { published, ...asset }: ManagedLibraryAsset
): Promise<void> => {
  const index = createLibraryAssetsRepository(await content.db());
  await (published ? index.save(asset) : index.remove(asset.id));
};

const stored = async (
  { db }: Pick<Context, "db">,
  id: string
): Promise<ManagedLibraryAsset | null> => {
  const row = await db
    .select()
    .from(libraryAsset)
    .where(eq(libraryAsset.id, id))
    .get();
  return row ? toAsset(row) : null;
};

/** Reads an uploaded structured-text file; BAD_REQUEST unless well-formed. */
const checkStructuredText = async (
  files: FileBucket,
  key: string
): Promise<void> => {
  const response = await fetch(await files.presignDownload(key));
  if (!response.ok) {
    throw new ORPCError("BAD_REQUEST", { message: `No uploaded file ${key}` });
  }
  const json: unknown = await response.json().catch(() => null);
  if (!structuredTextSchema.safeParse(json).success) {
    throw new ORPCError("BAD_REQUEST", {
      message: "The file is not in the structured-text format",
    });
  }
};

const list = admin.libraryAssets.list.handler(async ({ context }) => {
  const rows = await context.db
    .select()
    .from(libraryAsset)
    .orderBy(asc(libraryAsset.category), asc(libraryAsset.displayOrder));
  const assets = rows.map(toAsset);
  const keys = assets.flatMap(({ fileKey, coverKey }) =>
    coverKey ? [fileKey, coverKey] : [fileKey]
  );
  const previews = Object.fromEntries(
    await Promise.all(
      keys.map(
        async (key) => [key, await context.files.presignDownload(key)] as const
      )
    )
  );
  return { assets, previews };
});

/** Devices see the change after their next pull. */
const save = admin.libraryAssets.save.handler(async ({ context, input }) => {
  if (input.kind === "text") {
    await checkStructuredText(context.files, input.fileKey);
  }
  const asset = { ...input, id: input.id ?? randomUUID() };
  const row = toRow(asset);
  await context.db
    .insert(libraryAsset)
    .values(row)
    .onConflictDoUpdate({ target: libraryAsset.id, set: row });
  await publish(context.content, asset);
  return asset;
});

const setPublished = admin.libraryAssets.setPublished.handler(
  async ({ context, input: { id, published } }) => {
    const asset = await stored(context, id);
    if (!asset) {
      throw new ORPCError("NOT_FOUND", { message: `No Library Asset ${id}` });
    }
    const next = { ...asset, published };
    await context.db
      .update(libraryAsset)
      .set({ published, updatedAt: new Date() })
      .where(eq(libraryAsset.id, id));
    await publish(context.content, next);
    return next;
  }
);

/** The files stay in the bucket but are no longer served (`/files`). */
const remove = admin.libraryAssets.remove.handler(
  async ({ context, input: { id } }) => {
    await context.db.delete(libraryAsset).where(eq(libraryAsset.id, id));
    const index = createLibraryAssetsRepository(await context.content.db());
    await index.remove(id);
    return { id };
  }
);

export const libraryAssetsRouter = { list, save, setPublished, remove };

const LIBRARY_FOLDERS = ["library-asset/", "library-cover/"];

/**
 * For `mountFiles`: a Library Asset's file or cover is served only while a
 * published Library Asset uses it; every other uploaded file is served.
 */
export const servesLibraryFile =
  (content: ContentDatabase) =>
  async (key: string): Promise<boolean> => {
    if (!LIBRARY_FOLDERS.some((folder) => key.startsWith(folder))) {
      return true;
    }
    return createLibraryAssetsRepository(await content.db()).publishes(key);
  };
