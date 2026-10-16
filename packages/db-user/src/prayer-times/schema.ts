import { sqliteTable, text } from "drizzle-orm/sqlite-core";

/** The Believer's Prayer Times display choices, one row. */
export const prayerTimesSettings = sqliteTable("prayer_times_settings", {
  id: text("id").primaryKey(),
  /** JSON array of Prayer Time names; null until the Believer changes it. */
  hiddenPrayerTimes: text("hidden_prayer_times"),
  /** JSON array of Recent Cities (with time zone), newest first; null until one is chosen. */
  recentCities: text("recent_cities"),
});
