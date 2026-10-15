import { index, integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

/**
 * The Library Asset index: published Library Assets only (unpublished ones
 * stay on the server), so devices never receive one the Admins have not
 * published. Files and covers are keys in the files bucket.
 */
export const libraryAssets = sqliteTable(
  "library_assets",
  {
    id: text("id").primaryKey(),
    titleAr: text("title_ar").notNull(),
    titleEn: text("title_en").notNull().default(""),
    authorAr: text("author_ar").notNull().default(""),
    authorEn: text("author_en").notNull().default(""),
    descriptionAr: text("description_ar").notNull().default(""),
    descriptionEn: text("description_en").notNull().default(""),
    category: text("category").notNull(),
    kind: text("kind").notNull(),
    fileKey: text("file_key").notNull(),
    /** In bytes. */
    fileSize: integer("file_size").notNull(),
    coverKey: text("cover_key"),
    /** Place on the category's shelf, smallest first. */
    displayOrder: integer("display_order").notNull().default(0),
  },
  (table) => [index("library_assets_category").on(table.category)]
);
