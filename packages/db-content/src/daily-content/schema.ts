import { sqliteTable, text } from "drizzle-orm/sqlite-core";

/**
 * The Daily Content map: the Supplication Home features on each weekday. A
 * weekday without a row features nothing. Supplications live in the bundled
 * Books; this table refers to them only by their stable id.
 */
export const dailyContent = sqliteTable("daily_content", {
  /** `saturday` … `friday` (domain `WEEKDAYS`). */
  weekday: text("weekday").primaryKey(),
  supplicationId: text("supplication_id").notNull(),
});
