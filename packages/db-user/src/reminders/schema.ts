import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

/** How the Believer's Prayer Time Reminders behave, one row. */
export const reminderSettings = sqliteTable("reminder_settings", {
  id: text("id").primaryKey(),
  /** JSON object of each Salah's rule; null until the Believer changes one. */
  salahRules: text("salah_rules"),
  /** JSON of Imsak's rule; null until changed. */
  imsakRule: text("imsak_rule"),
  quietHoursEnabled: integer("quiet_hours_enabled", { mode: "boolean" }),
  /** Minutes after local midnight. */
  quietHoursStart: integer("quiet_hours_start"),
  quietHoursEnd: integer("quiet_hours_end"),
});
