import { real, sqliteTable, text } from "drizzle-orm/sqlite-core";

/**
 * Where the Believer stopped in each Library Asset they opened: a page (PDF),
 * a second (audio, video) or a block (structured text). One row per asset,
 * keyed by its id, so the latest save from any device wins on sync.
 */
export const libraryAssetPositions = sqliteTable("library_asset_positions", {
  assetId: text("asset_id").primaryKey(),
  position: real("position").notNull(),
  /** ISO instant. */
  savedAt: text("saved_at").notNull(),
});
