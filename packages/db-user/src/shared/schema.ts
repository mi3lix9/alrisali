import { DEFAULT_CALCULATION_METHOD } from "@alrisali/domain/shared";
import { real, sqliteTable, text } from "drizzle-orm/sqlite-core";

// `schema_version` is owned by the migrator (migrate.ts), not drizzle-kit.

/**
 * The Believer's settings, one row. Read by several features (Prayer Times,
 * Qibla, Reminders, the calendar), so it lives in shared.
 */
export const believerSettings = sqliteTable("believer_settings", {
  id: text("id").primaryKey(),
  calculationMethod: text("calculation_method")
    .notNull()
    .default(DEFAULT_CALCULATION_METHOD),
  locationLatitude: real("location_latitude"),
  locationLongitude: real("location_longitude"),
  locationName: text("location_name"),
});
