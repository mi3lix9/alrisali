import { index, integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

/**
 * The Believer's Khatmahs, finished ones too. Deleting one deletes its logs.
 * A Khatmah's sessions follow from its plan, so they are not stored.
 */
export const khatmahs = sqliteTable("khatmahs", {
  /** A uuid, so two devices never make the same id. */
  id: text("id").primaryKey(),
  /** JSON, read by `readKhatmahPlan`. */
  plan: text("plan").notNull(),
  /** ISO calendar date (`YYYY-MM-DD`) of the first session. */
  startDate: text("start_date").notNull(),
  /** Minutes after local midnight its daily reminder fires; null for none. */
  reminderAt: integer("reminder_at"),
  createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull(),
});

/**
 * One row per Khatmah Session completed; un-ticking deletes it. The id is
 * `<khatmahId>:<session>`, so the same completion made on two devices is one
 * row.
 */
export const khatmahLogs = sqliteTable(
  "khatmah_logs",
  {
    id: text("id").primaryKey(),
    khatmahId: text("khatmah_id").notNull(),
    /** The session's number, from 1. */
    session: integer("session").notNull(),
    /** ISO calendar date (`YYYY-MM-DD`) in the Believer's local time. */
    date: text("date").notNull(),
    completedAt: integer("completed_at", { mode: "timestamp_ms" }).notNull(),
  },
  (table) => [index("khatmah_logs_khatmah_id_idx").on(table.khatmahId)]
);
