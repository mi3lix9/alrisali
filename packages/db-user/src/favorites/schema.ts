import { index, sqliteTable, text } from "drizzle-orm/sqlite-core";

/**
 * The Believer's Favorites: a kind (Surah, ayah, Supplication, Library Asset)
 * and the key naming the item in that kind. The id is derived from both, so
 * the same Favorite made on two devices merges into one row on sync.
 */
export const favorites = sqliteTable(
  "favorites",
  {
    id: text("id").primaryKey(),
    kind: text("kind").notNull(),
    key: text("key").notNull(),
    /** ISO instant. */
    favoritedAt: text("favorited_at").notNull(),
  },
  (table) => [index("favorites_favorited_at").on(table.favoritedAt)]
);
