import { index, integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

/**
 * The Believer's Qada Plan, one row: the backlog as they entered it (what
 * remains is that less every Qada Log), the pace and the Qada Reminder.
 */
export const qadaPlan = sqliteTable("qada_plan", {
  id: text("id").primaryKey(),
  fajr: integer("fajr").notNull().default(0),
  dhuhr: integer("dhuhr").notNull().default(0),
  asr: integer("asr").notNull().default(0),
  maghrib: integer("maghrib").notNull().default(0),
  isha: integer("isha").notNull().default(0),
  fasts: integer("fasts").notNull().default(0),
  salahPerDay: integer("salah_per_day").notNull().default(5),
  fastsPerWeek: integer("fasts_per_week").notNull().default(2),
  reminderEnabled: integer("reminder_enabled", { mode: "boolean" })
    .notNull()
    .default(false),
  /** Minutes after local midnight. */
  reminderAt: integer("reminder_at").notNull().default(1260),
  /** JSON array of ISO weekdays (1 is Monday). */
  reminderWeekdays: text("reminder_weekdays")
    .notNull()
    .default("[1,2,3,4,5,6,7]"),
  updatedAt: integer("updated_at", { mode: "timestamp_ms" }).notNull(),
});

/**
 * One row per Qada Salah or fast made up; un-ticking deletes it. The id is
 * the Qada Log's own (`<date>:salah:<salah>:<n>`, `<date>:fast`), so the
 * same item logged on two devices, or from the Prayer Log, is one row.
 */
export const qadaLogs = sqliteTable(
  "qada_logs",
  {
    id: text("id").primaryKey(),
    /** ISO calendar date (`YYYY-MM-DD`) in the Believer's local time. */
    date: text("date").notNull(),
    /** salah | fast. */
    kind: text("kind").notNull(),
    /** The Salah made up; null for a fast. */
    salah: text("salah"),
    loggedAt: integer("logged_at", { mode: "timestamp_ms" }).notNull(),
  },
  (table) => [index("qada_logs_date_idx").on(table.date)]
);
