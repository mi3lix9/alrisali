import { normalizeSearchText } from "../shared";
import { sortLibraryAssets } from "./library-asset";
import type { LibraryAsset } from "./library-asset";

/**
 * The Library Assets whose Arabic or English title contains `query`, ignoring
 * diacritics, letter forms and case, in the Admins' order.
 */
export const searchLibraryAssets = <T extends LibraryAsset>(
  assets: readonly T[],
  query: string
): T[] => {
  const needle = normalizeSearchText(query);
  if (!needle) {
    return [];
  }
  return sortLibraryAssets(assets).filter(
    ({ title }) =>
      normalizeSearchText(title.ar).includes(needle) ||
      normalizeSearchText(title.en).includes(needle)
  );
};
