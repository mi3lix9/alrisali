import type { ManagedLibraryAsset } from "@alrisali/api/library-assets";
import type { LibraryCategory } from "@alrisali/domain/library-assets";

/** The order that puts a new asset last in `category`: 0 when it is empty. */
export const nextOrder = (
  assets: readonly ManagedLibraryAsset[],
  category: LibraryCategory
): number =>
  Math.max(
    -1,
    ...assets
      .filter((asset) => asset.category === category)
      .map((asset) => asset.order)
  ) + 1;

const UNITS = ["KiB", "MiB", "GiB"] as const;
const STEP = 1024;

/** A size in bytes as people read it, such as "1.5 MiB". */
export const formatFileSize = (bytes: number): string => {
  if (bytes < STEP) {
    return `${bytes} B`;
  }
  let size = bytes;
  let unit = "B";
  for (const next of UNITS) {
    if (size < STEP) {
      break;
    }
    size /= STEP;
    unit = next;
  }
  return `${size.toFixed(1).replace(/\.0$/u, "")} ${unit}`;
};
