import { favoriteId, favoriteItemSchema } from "@alrisali/domain/favorites";
import type { FavoriteItem } from "@alrisali/domain/favorites";
import { desc, eq } from "drizzle-orm";

import type { UserDb } from "../shared";
import { favorites } from "./schema";

export type Favorite = FavoriteItem & {
  /** ISO instant the Believer favourited the item. */
  favoritedAt: string;
};

export interface FavoritesRepository {
  /** Every Favorite, newest first. */
  list: () => Promise<Favorite[]>;
  has: (item: FavoriteItem) => Promise<boolean>;
  /** Favourites the item; one already a Favorite keeps its first date. */
  add: (item: FavoriteItem) => Promise<void>;
  remove: (item: FavoriteItem) => Promise<void>;
}

export const createFavoritesRepository = (
  db: UserDb,
  now: () => Date = () => new Date()
): FavoritesRepository => {
  const list = async (): Promise<Favorite[]> => {
    const rows = await db
      .select()
      .from(favorites)
      .orderBy(desc(favorites.favoritedAt), favorites.id);
    return rows.flatMap(({ kind, key, favoritedAt }) => {
      // A newer app may have synced a kind this one does not know.
      const item = favoriteItemSchema.safeParse({ kind, key });
      return item.success ? [{ ...item.data, favoritedAt }] : [];
    });
  };

  const has = async (item: FavoriteItem): Promise<boolean> => {
    const row = await db
      .select({ id: favorites.id })
      .from(favorites)
      .where(eq(favorites.id, favoriteId(favoriteItemSchema.parse(item))))
      .get();
    return row !== undefined;
  };

  const add = async (item: FavoriteItem): Promise<void> => {
    const parsed = favoriteItemSchema.parse(item);
    await db
      .insert(favorites)
      .values({
        id: favoriteId(parsed),
        kind: parsed.kind,
        key: parsed.key,
        favoritedAt: now().toISOString(),
      })
      .onConflictDoNothing({ target: favorites.id });
  };

  const remove = async (item: FavoriteItem): Promise<void> => {
    await db
      .delete(favorites)
      .where(eq(favorites.id, favoriteId(favoriteItemSchema.parse(item))));
  };

  return { list, has, add, remove };
};
