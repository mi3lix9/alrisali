import { index, integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

/**
 * The Believer's Tasbih counters. Tasbih al-Zahra is the row with the fixed
 * id `tasbih-al-zahra` and kind `tasbih-al-zahra`; Open Tasbih rows (kind
 * `open`) carry a name, and optionally a target and notes.
 */
export const tasbih = sqliteTable("tasbih", {
  id: text("id").primaryKey(),
  kind: text("kind").notNull(),
  name: text("name"),
  /** Taps counted in the current step (Tasbih al-Zahra) or in total (open). */
  count: integer("count").notNull().default(0),
  /** Tasbih al-Zahra's current step index. */
  step: integer("step").notNull().default(0),
  /** An Open Tasbih's target, if it has one. */
  target: integer("target"),
  /** An Open Tasbih's notes, if it has any. */
  notes: text("notes"),
});

/** One completed round of a Tasbih. */
export const dhikrSessions = sqliteTable(
  "dhikr_sessions",
  {
    id: text("id").primaryKey(),
    tasbihId: text("tasbih_id").notNull(),
    count: integer("count").notNull(),
    /** Milliseconds since the epoch. */
    completedAt: integer("completed_at").notNull(),
  },
  (table) => [index("dhikr_sessions_completed_at").on(table.completedAt)]
);

/**
 * The Believer's Tasbih choices, one row. Columns are nullable: null reads as
 * the default, so a new choice needs no backfill.
 */
export const tasbihSettings = sqliteTable("tasbih_settings", {
  id: text("id").primaryKey(),
  /** sound-and-haptic | haptic | silent. */
  feedbackMode: text("feedback_mode"),
});
