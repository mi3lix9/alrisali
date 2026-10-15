import { index, integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

/** Each Mood Check-in the Believer made, and the Remedy it was answered with. */
export const moodCheckIns = sqliteTable(
  "mood_check_ins",
  {
    id: text("id").primaryKey(),
    mood: text("mood").notNull(),
    /** A Remedy id from `@alrisali/domain/mood`. */
    remedyId: text("remedy_id").notNull(),
    checkedInAt: integer("checked_in_at", { mode: "timestamp_ms" }).notNull(),
  },
  (table) => [index("mood_check_ins_checked_in_at_idx").on(table.checkedInAt)]
);
