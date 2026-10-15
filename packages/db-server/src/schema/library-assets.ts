import { sql } from "drizzle-orm";
import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

/**
 * Every Library Asset Admins manage, published or not. Only published ones
 * are copied to the content database devices pull, so an unpublished one
 * never leaves the server.
 */
export const libraryAsset = sqliteTable("library_asset", {
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
  displayOrder: integer("display_order").notNull().default(0),
  published: integer("published", { mode: "boolean" }).notNull().default(false),
  updatedAt: integer("updated_at", { mode: "timestamp_ms" })
    .default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
    .notNull(),
});
