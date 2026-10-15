import { index, integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

/**
 * The Believer's Khushu, one row per Salah per date; removing it deletes the
 * row. The id is `<date>:<salah>`, like the Prayer Log's, so the same rating
 * made on two devices is one row and an edit replaces it.
 */
export const khushu = sqliteTable(
  "khushu",
  {
    id: text("id").primaryKey(),
    /** ISO calendar date (`YYYY-MM-DD`) in the Believer's local time. */
    date: text("date").notNull(),
    salah: text("salah").notNull(),
    /** 0 (distracted) to 10 (full Khushu). */
    level: integer("level").notNull(),
    /** JSON array of picked Distraction names. */
    distractions: text("distractions").notNull(),
    /** The Distraction the Believer typed, if any. */
    customDistraction: text("custom_distraction"),
    ratedAt: integer("rated_at", { mode: "timestamp_ms" }).notNull(),
  },
  (table) => [index("khushu_date_idx").on(table.date)]
);
