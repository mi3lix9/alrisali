import { createFavoritesRepository } from "@alrisali/db-user/favorites";
import type { Favorite } from "@alrisali/db-user/favorites";
import { favoriteId } from "@alrisali/domain/favorites";
import type { FavoriteItem } from "@alrisali/domain/favorites";
import { useMutation, useQuery } from "@tanstack/react-query";

import { queryClient } from "@/shared/lib/orpc";
import {
  getUserDatabase,
  USER_DATA_QUERY_KEY,
} from "@/shared/lib/user-database";

const FAVORITES_QUERY_KEY = [...USER_DATA_QUERY_KEY, "favorites"];

const listFavorites = async (): Promise<Favorite[]> => {
  const { db } = await getUserDatabase();
  return createFavoritesRepository(db).list();
};

/** Every Favorite, newest first. */
export const useFavorites = () =>
  useQuery({ queryKey: FAVORITES_QUERY_KEY, queryFn: listFavorites });

/** Whether the item is one of the Believer's Favorites. */
export const useIsFavorite = (item: FavoriteItem) => {
  const id = favoriteId(item);
  return useQuery({
    queryKey: FAVORITES_QUERY_KEY,
    queryFn: listFavorites,
    select: (favorites) =>
      favorites.some((favorite) => favoriteId(favorite) === id),
  });
};

/** Favourites an item, or removes it from the Favorites. */
export const useSetFavorite = () =>
  useMutation({
    mutationFn: async ({
      item,
      favorite,
    }: {
      item: FavoriteItem;
      favorite: boolean;
    }) => {
      const { db } = await getUserDatabase();
      const favorites = createFavoritesRepository(db);
      await (favorite ? favorites.add(item) : favorites.remove(item));
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: FAVORITES_QUERY_KEY });
    },
  });
