import { DEFAULT_HIJRI_ADJUSTMENT } from "@alrisali/domain/shared";
import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

// `schema_version` is owned by the migrator (migrate.ts), not drizzle-kit.

/**
 * Content settings that apply to every Believer, one row (`id` "global").
 * Every Hijri Date reads it, so it lives in shared.
 */
export const globalSettings = sqliteTable("global_settings", {
  id: text("id").primaryKey(),
  /** The Admins' Hijri Adjustment in days, added to every Believer's own. */
  hijriAdjustment: integer("hijri_adjustment")
    .notNull()
    .default(DEFAULT_HIJRI_ADJUSTMENT),
});
