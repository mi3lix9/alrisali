import { sqliteTable, text } from "drizzle-orm/sqlite-core";

/**
 * The Believer's Qibla choices, one row. Columns are nullable: null reads as
 * the default, so a new choice needs no backfill.
 */
export const qiblaSettings = sqliteTable("qibla_settings", {
  id: text("id").primaryKey(),
  /** kaaba | najaf | karbala | mashhad | madina | kadhimiya | samarra. */
  target: text("target"),
});
