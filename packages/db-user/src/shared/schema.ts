import {
  DEFAULT_CALCULATION_METHOD,
  DEFAULT_HIJRI_ADJUSTMENT,
  DEFAULT_IMSAK_MINUTES,
} from "@alrisali/domain/shared";
import { integer, real, sqliteTable, text } from "drizzle-orm/sqlite-core";

// `schema_version` is owned by the migrator (migrate.ts), not drizzle-kit.

/**
 * The Believer's settings, one row. Read by several features (Prayer Times,
 * Qibla, Reminders, every Hijri Date), so it lives in shared.
 */
export const believerSettings = sqliteTable("believer_settings", {
  id: text("id").primaryKey(),
  calculationMethod: text("calculation_method")
    .notNull()
    .default(DEFAULT_CALCULATION_METHOD),
  locationLatitude: real("location_latitude"),
  locationLongitude: real("location_longitude"),
  locationName: text("location_name"),
  /** The Believer's own Hijri Adjustment in days (−2…+2). */
  hijriAdjustment: integer("hijri_adjustment")
    .notNull()
    .default(DEFAULT_HIJRI_ADJUSTMENT),
  /** Whether the location follows the device's GPS, or was chosen by hand. */
  locationFollowsDevice: integer("location_follows_device", {
    mode: "boolean",
  })
    .notNull()
    .default(true),
  imsakMinutes: integer("imsak_minutes")
    .notNull()
    .default(DEFAULT_IMSAK_MINUTES),
  /** "12h" or "24h"; null follows the device's clock setting. */
  timeFormat: text("time_format"),
  /** "classic" or "modern"; null until chosen, read as Classic. */
  messageStyle: text("message_style"),
});

/**
 * The Believer's shell preferences, one row: the language, theme, text size
 * and hidden tabs, so they follow the Believer to a new phone. Every column
 * is null until chosen on some device. The shell reads them before its first
 * frame, so the device keeps a startup cache (apps/native preferences).
 */
export const shellPreferences = sqliteTable("shell_preferences", {
  id: text("id").primaryKey(),
  language: text("language"),
  theme: text("theme"),
  textSize: text("text_size"),
  /** The hidden tabs, a JSON array of tab names. */
  hiddenTabs: text("hidden_tabs"),
});
