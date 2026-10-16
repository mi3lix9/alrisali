import type { Favorite } from "@alrisali/db-user/favorites";
import { favoriteId } from "@alrisali/domain/favorites";

import { useFavorites } from "../data/favorites";
import { favoriteEntry } from "../utils/favorite-entry";
import type { FavoriteEntry } from "../utils/favorite-entry";

export interface ListedFavorite {
  id: string;
  favorite: Favorite;
  entry: FavoriteEntry;
}

/**
 * The Favorites this device can show, newest first, each with what the list
 * shows for it. Library Assets are listed when `libraryAssetTitle` names them.
 */
export const useFavoriteEntries = (
  libraryAssetTitle?: (id: string) => string | undefined
) => {
  const favorites = useFavorites();
  const listed = (favorites.data ?? []).flatMap((favorite) => {
    const entry = favoriteEntry(favorite, libraryAssetTitle);
    return entry ? [{ id: favoriteId(favorite), favorite, entry }] : [];
  });
  return { listed, isPending: favorites.isPending };
};
