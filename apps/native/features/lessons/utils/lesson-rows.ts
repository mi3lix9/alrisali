import {
  lessonProgressSummary,
  visibleLessons,
} from "@alrisali/domain/lessons";
import type {
  Lesson,
  LessonCategory,
  LessonProgress,
  LessonProgressSummary,
} from "@alrisali/domain/lessons";

export interface LessonRow {
  lesson: Lesson;
  summary: LessonProgressSummary;
}

/**
 * The Lessons to list, of `category` when given, each with the Believer's
 * progress against its real number of Slides.
 */
export const lessonRows = (
  lessons: readonly Lesson[],
  progress: Readonly<Record<string, LessonProgress>>,
  category: LessonCategory | null
): LessonRow[] =>
  visibleLessons(lessons, category).map((lesson) => ({
    lesson,
    summary: lessonProgressSummary(
      progress[lesson.id] ?? null,
      lesson.slides.length
    ),
  }));
