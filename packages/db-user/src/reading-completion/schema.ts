import { index, sqliteTable, text } from "drizzle-orm/sqlite-core";

/**
 * The Believer's Reading Completions: a Supplication read on a calendar day.
 * The id is derived from both, so marking it read on two devices the same day
 * merges into one row on sync.
 */
export const readingCompletions = sqliteTable(
  "reading_completions",
  {
    id: text("id").primaryKey(),
    supplicationId: text("supplication_id").notNull(),
    /** The Believer's local calendar day, `YYYY-MM-DD`. */
    date: text("date").notNull(),
    /** ISO instant. */
    completedAt: text("completed_at").notNull(),
  },
  (table) => [index("reading_completions_date").on(table.date)]
);
