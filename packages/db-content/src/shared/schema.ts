import { DEFAULT_HIJRI_ADJUSTMENT } from "@alrisali/domain/shared";
import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

// `schema_version` is owned by the migrator (migrate.ts), not drizzle-kit.

/**
 * Content settings that apply to every Believer, one row (`id` "global").
 * Every Hijri Date reads it, so it lives in shared.
 */
export const globalSettings = sqliteTable("global_settings", {
  id: text("id").primaryKey(),
  /** The Admins' Hijri Adjustment offset in days, added to every Believer's own. */
  hijriAdjustment: integer("hijri_adjustment")
    .notNull()
    .default(DEFAULT_HIJRI_ADJUSTMENT),
  /**
   * A forced Hijri Date that replaces the offset from `forcedHijriFrom`
   * through `forcedHijriUntil` (ISO dates): the Hijri year, month and day of
   * that first day. All null when none is published.
   */
  forcedHijriYear: integer("forced_hijri_year"),
  forcedHijriMonth: integer("forced_hijri_month"),
  forcedHijriDay: integer("forced_hijri_day"),
  forcedHijriFrom: text("forced_hijri_from"),
  forcedHijriUntil: text("forced_hijri_until"),
});

/**
 * The Occasions Admins publish; devices show them after the built-in ones.
 * Shared because the calendar (devices) and the Admins' Occasions both use it.
 */
export const occasions = sqliteTable("occasions", {
  id: text("id").primaryKey(),
  /** Hijri month, 1–12. */
  month: integer("month").notNull(),
  /** Hijri day, 1–30; the 30th falls on the 29th in a 29-day month. */
  day: integer("day").notNull(),
  /** One of the domain's `OCCASION_TYPES`. */
  type: text("type").notNull(),
  nameAr: text("name_ar").notNull(),
  nameEn: text("name_en").notNull(),
  /** Milliseconds since the epoch; orders Occasions of the same day. */
  createdAt: integer("created_at").notNull(),
});
