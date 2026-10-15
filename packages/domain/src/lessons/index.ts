export {
  LESSON_CATEGORIES,
  lessonFieldsSchema,
  lessonSchema,
  slideSchema,
  visibleLessons,
  withSlidesWhenPublished,
} from "./lesson";
export type { Lesson, LessonCategory, Slide } from "./lesson";
export {
  lessonProgressSchema,
  lessonProgressSummary,
  markLessonComplete,
  viewSlide,
} from "./progress";
export type {
  LessonProgress,
  LessonProgressChange,
  LessonProgressSummary,
  LessonStatus,
} from "./progress";
