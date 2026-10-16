import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

/**
 * The section (passage index, from 0) the Believer reached in each
 * Supplication they read. One row per Supplication, keyed by its stable id, so
 * the latest save from any device wins on sync.
 */
export const supplicationPositions = sqliteTable("supplication_positions", {
  supplicationId: text("supplication_id").primaryKey(),
  section: integer("section").notNull(),
  /** ISO instant. */
  savedAt: text("saved_at").notNull(),
});
