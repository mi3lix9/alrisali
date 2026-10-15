import { LESSON_CATEGORIES } from "@alrisali/domain/lessons";
import type { LessonCategory } from "@alrisali/domain/lessons";

export const CATEGORY_LABELS: Record<LessonCategory, string> = {
  aqeedah: "Aqeedah (creed)",
  fiqh: "Fiqh (jurisprudence)",
  akhlaq: "Akhlaq (character)",
  history: "History",
};

export const isLessonCategory = (value: string): value is LessonCategory =>
  LESSON_CATEGORIES.some((category) => category === value);
