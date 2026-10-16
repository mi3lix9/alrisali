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

/**
 * How the Believer is alerted to Occasions, one row. Columns are nullable:
 * null reads as the default (off), so a new choice needs no backfill.
 */
export const occasionAlertSettings = sqliteTable("occasion_alert_settings", {
  id: text("id").primaryKey(),
  enabled: integer("enabled", { mode: "boolean" }),
  /** day-of | evening-before. */
  timing: text("timing"),
  /** Minutes after local midnight. */
  time: integer("time"),
  /** JSON array of the Occasion types that alert. */
  types: text("types"),
});

/**
 * Which night-dua Reminders the Believer turned on, one row: Kumayl, Tawassul,
 * Nudba and the ziyarah of the day, each its own toggle, all off by default.
 */
export const nightDuaAlerts = sqliteTable("night_dua_alerts", {
  id: text("id").primaryKey(),
  kumayl: integer("kumayl", { mode: "boolean" }).notNull().default(false),
  tawassul: integer("tawassul", { mode: "boolean" }).notNull().default(false),
  nudba: integer("nudba", { mode: "boolean" }).notNull().default(false),
  ziyarah: integer("ziyarah", { mode: "boolean" }).notNull().default(false),
});
