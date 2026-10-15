import { index, integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

/**
 * The Believer's Subscriptions. The id is the Program's id, so subscribing on
 * two devices makes one Subscription when they sync.
 */
export const programSubscriptions = sqliteTable("program_subscriptions", {
  id: text("id").primaryKey(),
  /** `general`, `seasonal` or `personal`: what the limits count. */
  programKind: text("program_kind").notNull(),
  paused: integer("paused", { mode: "boolean" }).notNull().default(false),
  /** Milliseconds since the epoch. */
  subscribedAt: integer("subscribed_at").notNull(),
});

/**
 * One row per Act the Believer completed on a date; undoing deletes it. The
 * id is `<programId>:<actId>:<date>`, so the same Act Completion made on two
 * devices is one row.
 */
export const actCompletions = sqliteTable(
  "act_completions",
  {
    id: text("id").primaryKey(),
    programId: text("program_id").notNull(),
    actId: text("act_id").notNull(),
    /** ISO calendar date (`YYYY-MM-DD`) in the Believer's local time. */
    date: text("date").notNull(),
    completedAt: integer("completed_at", { mode: "timestamp_ms" }).notNull(),
  },
  (table) => [index("act_completions_date_idx").on(table.date)]
);

/**
 * The Programs the Believer has opened (id = Program id); the others carry a
 * "new" badge.
 */
export const seenPrograms = sqliteTable("seen_programs", {
  id: text("id").primaryKey(),
  seenAt: integer("seen_at", { mode: "timestamp_ms" }).notNull(),
});

/**
 * The Programs the Believer built. Only their own database holds them, so
 * only they can subscribe. The Acts are one JSON array (`Act[]`, read with
 * `@alrisali/domain/programs`), so a Program edited on two devices merges as
 * one row: the last push wins whole, never a mix of two Act lists.
 */
export const personalPrograms = sqliteTable("personal_programs", {
  /** A uuid. */
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description").notNull().default(""),
  acts: text("acts").notNull().default("[]"),
  createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp_ms" }).notNull(),
});
