import type { FavoriteKind } from "./favorite-item";

/** The tabs of the Favorites screen, in the order they are shown. */
export const FAVORITE_TABS = ["all", "quran", "supplications"] as const;

export type FavoriteTab = (typeof FAVORITE_TABS)[number];

/**
 * The tab each kind has besides All. Library materials have none: they are
 * neither Quran nor Supplication, so they show under All only.
 */
const TAB_OF_KIND: Record<FavoriteKind, FavoriteTab | null> = {
  surah: "quran",
  ayah: "quran",
  supplication: "supplications",
  "library-asset": null,
};

/** The Favorites a tab shows, in the order given. */
export const favoritesInTab = <Favorite extends { kind: FavoriteKind }>(
  favorites: readonly Favorite[],
  tab: FavoriteTab
): Favorite[] =>
  tab === "all"
    ? [...favorites]
    : favorites.filter((favorite) => TAB_OF_KIND[favorite.kind] === tab);
