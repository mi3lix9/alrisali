import { index, integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

// Installed apps read these tables, so changes stay additive (new columns
// nullable or defaulted). Rows are validated by `@alrisali/domain/lessons`
// on read, so a newer category is skipped by an older app.

/** Lessons, published or not, in the Admins' order. */
export const lessons = sqliteTable("lessons", {
  id: text("id").primaryKey(),
  titleAr: text("title_ar").notNull(),
  titleEn: text("title_en").notNull().default(""),
  descriptionAr: text("description_ar").notNull().default(""),
  descriptionEn: text("description_en").notNull().default(""),
  /** One of the domain's `LESSON_CATEGORIES`. */
  category: text("category").notNull(),
  published: integer("published", { mode: "boolean" }).notNull().default(false),
  position: integer("position").notNull(),
});

/** A Lesson's Slides, in the order Believers swipe through them. */
export const lessonSlides = sqliteTable(
  "lesson_slides",
  {
    id: text("id").primaryKey(),
    lessonId: text("lesson_id").notNull(),
    position: integer("position").notNull(),
    /** Where the image is in the files bucket; devices load it from the server. */
    imageKey: text("image_key").notNull(),
    captionAr: text("caption_ar").notNull().default(""),
    captionEn: text("caption_en").notNull().default(""),
  },
  (table) => [index("lesson_slides_lesson_idx").on(table.lessonId)]
);
