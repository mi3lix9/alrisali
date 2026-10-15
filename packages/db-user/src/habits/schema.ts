import { index, integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

/** The Believer's Habits. Deleting one deletes its completions too. */
export const habits = sqliteTable("habits", {
  /** A uuid, or `default:<preset>` for a seeded default. */
  id: text("id").primaryKey(),
  /** The Believer's own name; null for a default, named by its preset. */
  name: text("name"),
  /** A preset from `@alrisali/domain/habits`; null for the Believer's own. */
  preset: text("preset"),
  /** JSON, read by `readHabitSchedule`. */
  schedule: text("schedule").notNull(),
  /** Minutes after local midnight its Reminder fires; null for none. */
  reminderAt: integer("reminder_at"),
  archivedAt: integer("archived_at", { mode: "timestamp_ms" }),
  createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull(),
});

/**
 * One row per date a Habit was ticked; un-ticking deletes it. The id is
 * `<habitId>:<date>`, so the same tick made on two devices is one row.
 */
export const habitCompletions = sqliteTable(
  "habit_completions",
  {
    id: text("id").primaryKey(),
    habitId: text("habit_id").notNull(),
    /** ISO calendar date (`YYYY-MM-DD`) in the Believer's local time. */
    date: text("date").notNull(),
    completedAt: integer("completed_at", { mode: "timestamp_ms" }).notNull(),
  },
  (table) => [
    index("habit_completions_habit_id_idx").on(table.habitId),
    index("habit_completions_date_idx").on(table.date),
  ]
);

/**
 * Marks that the default Habits were seeded (row `defaults`), so a deleted
 * default never comes back.
 */
export const habitSeeds = sqliteTable("habit_seeds", {
  id: text("id").primaryKey(),
  seededAt: integer("seeded_at", { mode: "timestamp_ms" }).notNull(),
});
