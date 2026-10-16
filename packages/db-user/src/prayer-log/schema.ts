import { index, integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

/**
 * One row per Salah the Believer logged on a date; un-ticking deletes it.
 * The id is `<date>:<salah>` rather than a uuid, so the same tick made on two
 * devices is the same row and sync never doubles it.
 */
export const prayerLogs = sqliteTable(
  "prayer_logs",
  {
    id: text("id").primaryKey(),
    /** ISO calendar date (`YYYY-MM-DD`) in the Believer's local time. */
    date: text("date").notNull(),
    salah: text("salah").notNull(),
    loggedAt: integer("logged_at", { mode: "timestamp_ms" }).notNull(),
  },
  (table) => [index("prayer_logs_date_idx").on(table.date)]
);
