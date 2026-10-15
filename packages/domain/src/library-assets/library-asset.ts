import { z } from "zod";

import { fileKeySchema } from "../shared/files";
import {
  localizedTextSchema,
  optionalLocalizedTextSchema,
} from "../shared/localized-text";

/** What a Library Asset holds, which decides the viewer that opens it. */
export const LIBRARY_ASSET_KINDS = ["pdf", "audio", "video", "text"] as const;

export type LibraryAssetKind = (typeof LIBRARY_ASSET_KINDS)[number];

/** The Library's shelves, in the order it shows them. */
export const LIBRARY_CATEGORIES = [
  "quran",
  "hadith",
  "dua",
  "fiqh",
  "history",
  "general",
] as const;

export type LibraryCategory = (typeof LIBRARY_CATEGORIES)[number];

/**
 * The kind of each file extension a Library Asset may have. The upload rules
 * (`library-asset` purpose) produce exactly these extensions.
 */
const KIND_OF_EXTENSION: Record<string, LibraryAssetKind> = {
  pdf: "pdf",
  mp3: "audio",
  m4a: "audio",
  mp4: "video",
  json: "text",
};

/** The kind of Library Asset a file is, by its key; null for any other file. */
export const libraryAssetKindOf = (
  fileKey: string
): LibraryAssetKind | null => {
  const extension = fileKey.slice(fileKey.lastIndexOf(".") + 1);
  return Object.hasOwn(KIND_OF_EXTENSION, extension)
    ? (KIND_OF_EXTENSION[extension] ?? null)
    : null;
};

const uploadedAs = (purpose: string) =>
  fileKeySchema.refine(
    (key) => key.startsWith(`${purpose}/`),
    `Not an uploaded ${purpose}`
  );

/**
 * A file (PDF, audio, video, structured text) Admins publish to the Library.
 * `order` places it on its category's shelf (smallest first). Devices only
 * ever receive published ones.
 */
export const libraryAssetFieldsSchema = z.object({
  id: z.string().min(1),
  title: localizedTextSchema,
  author: optionalLocalizedTextSchema,
  description: optionalLocalizedTextSchema,
  category: z.enum(LIBRARY_CATEGORIES),
  kind: z.enum(LIBRARY_ASSET_KINDS),
  fileKey: uploadedAs("library-asset"),
  /** In bytes. */
  fileSize: z.number().int().positive(),
  coverKey: uploadedAs("library-cover").nullable(),
  order: z.number().int().min(0),
});

/** Refuses a file that is not of the Library Asset's kind. */
export const withFileOfItsKind = <
  T extends z.ZodType<{ kind: LibraryAssetKind; fileKey: string }>,
>(
  schema: T
) =>
  schema.refine(({ kind, fileKey }) => libraryAssetKindOf(fileKey) === kind, {
    message: "The file is not of this kind",
    path: ["fileKey"],
  });

export const libraryAssetSchema = withFileOfItsKind(libraryAssetFieldsSchema);

export type LibraryAsset = z.infer<typeof libraryAssetSchema>;

/** One category's Library Assets, in the Admins' order. */
export interface LibraryShelf<T extends LibraryAsset = LibraryAsset> {
  category: LibraryCategory;
  assets: T[];
}

const byOrderThenTitle = (a: LibraryAsset, b: LibraryAsset): number =>
  a.order - b.order ||
  a.title.ar.localeCompare(b.title.ar, "ar") ||
  a.id.localeCompare(b.id);

/** The Library Assets in the Admins' order: by `order`, then Arabic title. */
export const sortLibraryAssets = <T extends LibraryAsset>(
  assets: readonly T[]
): T[] => assets.toSorted(byOrderThenTitle);

/**
 * The non-empty shelves, in `LIBRARY_CATEGORIES` order. Admins' assets keep
 * their extra fields (whether published).
 */
export const libraryShelves = <T extends LibraryAsset>(
  assets: readonly T[]
): LibraryShelf<T>[] => {
  const sorted = sortLibraryAssets(assets);
  return LIBRARY_CATEGORIES.flatMap((category) => {
    const onShelf = sorted.filter((asset) => asset.category === category);
    return onShelf.length > 0 ? [{ category, assets: onShelf }] : [];
  });
};
