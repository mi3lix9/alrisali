import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

/**
 * The Believer's progress through each Lesson, one row per Lesson (the id is
 * the Lesson's), so the same Lesson on two devices merges into one row on
 * sync. Slides are counted by position, from 0.
 */
export const lessonProgress = sqliteTable("lesson_progress", {
  lessonId: text("lesson_id").primaryKey(),
  currentSlide: integer("current_slide").notNull(),
  furthestSlide: integer("furthest_slide").notNull(),
  /** Epoch ms; null until the Lesson is completed. */
  completedAt: integer("completed_at"),
  /** Epoch ms. */
  updatedAt: integer("updated_at").notNull(),
});
