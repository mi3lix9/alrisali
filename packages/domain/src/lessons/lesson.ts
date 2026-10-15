import { z } from "zod";

import { fileKeySchema } from "../shared/files";
import {
  localizedTextSchema,
  optionalLocalizedTextSchema,
} from "../shared/localized-text";

/** What a Lesson teaches, for browsing. */
export const LESSON_CATEGORIES = [
  "aqeedah",
  "fiqh",
  "akhlaq",
  "history",
] as const;

export type LessonCategory = (typeof LESSON_CATEGORIES)[number];

/** One image with a caption inside a Lesson. */
export const slideSchema = z.object({
  id: z.string().min(1),
  /** The uploaded image, a `slide/…` key in the files bucket. */
  imageKey: fileKeySchema,
  caption: optionalLocalizedTextSchema,
});

export type Slide = z.infer<typeof slideSchema>;

/**
 * An Admin-published teaching made of ordered Slides. Without the rule that
 * a published Lesson has Slides: extend this, then apply
 * `withSlidesWhenPublished`.
 */
export const lessonFieldsSchema = z.object({
  id: z.string().min(1),
  title: localizedTextSchema,
  description: optionalLocalizedTextSchema,
  category: z.enum(LESSON_CATEGORIES),
  /** Devices show only published Lessons. */
  published: z.boolean(),
  /** In the order Believers swipe through them. */
  slides: z.array(slideSchema),
});

/** Refuses publishing a Lesson that has no Slides to show. */
export const withSlidesWhenPublished = <
  T extends z.ZodType<{ published: boolean; slides: readonly unknown[] }>,
>(
  schema: T
) =>
  schema.refine(({ published, slides }) => !published || slides.length > 0, {
    message: "A published Lesson needs at least one Slide",
    path: ["slides"],
  });

export const lessonSchema = withSlidesWhenPublished(lessonFieldsSchema);

export type Lesson = z.infer<typeof lessonSchema>;

/**
 * The Lessons a device shows, in the Admins' order: published ones, of
 * `category` when given.
 */
export const visibleLessons = (
  lessons: readonly Lesson[],
  category?: LessonCategory | null
): Lesson[] =>
  lessons.filter(
    (lesson) =>
      lesson.published &&
      lesson.slides.length > 0 &&
      (category ? lesson.category === category : true)
  );
