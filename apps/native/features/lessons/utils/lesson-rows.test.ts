import type { Lesson, LessonProgress } from "@alrisali/domain/lessons";
import { describe, expect, it } from "vitest";

import { lessonRows } from "./lesson-rows";

const slides = (count: number) =>
  Array.from({ length: count }, (_, index) => ({
    id: `s${index}`,
    imageKey: `slide/00000000-0000-4000-8000-00000000000${index}.png`,
    caption: { ar: "", en: "" },
  }));

const lesson = (id: string, category: Lesson["category"], count: number) =>
  ({
    id,
    title: { ar: id, en: id },
    description: { ar: "", en: "" },
    category,
    published: true,
    slides: slides(count),
  }) satisfies Lesson;

const tawheed = lesson("tawheed", "aqeedah", 4);
const wudu = lesson("wudu", "fiqh", 10);

const progress: Record<string, LessonProgress> = {
  wudu: {
    lessonId: "wudu",
    currentSlide: 4,
    furthestSlide: 4,
    completedAt: null,
    updatedAt: 1,
  },
};

describe(lessonRows, () => {
  it("pairs each Lesson with progress counted against its own Slides", () => {
    expect(lessonRows([tawheed, wudu], progress, null)).toStrictEqual([
      {
        lesson: tawheed,
        summary: { status: "new", seen: 0, total: 4, fraction: 0, resumeAt: 0 },
      },
      {
        lesson: wudu,
        summary: {
          status: "in-progress",
          seen: 5,
          total: 10,
          fraction: 0.5,
          resumeAt: 4,
        },
      },
    ]);
  });

  it("shows only the chosen category", () => {
    expect(
      lessonRows([tawheed, wudu], progress, "fiqh").map((row) => row.lesson.id)
    ).toStrictEqual(["wudu"]);
  });
});
