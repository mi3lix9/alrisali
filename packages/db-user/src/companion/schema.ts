import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

/**
 * Each XP award the Companion received. The id is the award key from
 * `@alrisali/domain/companion` (`salah:2026-10-16:fajr`), so the same event
 * awarded on two devices merges into one row on sync and is counted once.
 * The Companion's XP is the sum of `xp`.
 */
export const companionXpAwards = sqliteTable("companion_xp_awards", {
  id: text("id").primaryKey(),
  /** The kind of devotion (`salah`, `lesson`, …). */
  kind: text("kind").notNull(),
  xp: integer("xp").notNull(),
  awardedAt: integer("awarded_at", { mode: "timestamp_ms" }).notNull(),
});

/** The Believer's Companion: one row, id `companion`. */
export const companion = sqliteTable("companion", {
  id: text("id").primaryKey(),
  /** `traveler` or `garden`. */
  theme: text("theme").notNull(),
});
