import { describe, expect, it } from "vitest";

import {
  lessonProgressSummary,
  lessonSchema,
  markLessonComplete,
  viewSlide,
  visibleLessons,
} from ".";
import type { Lesson, LessonProgress } from ".";

const slide = (id: string) => ({
  id,
  imageKey: `slide/00000000-0000-4000-8000-00000000000${id.at(-1)}.png`,
  caption: { ar: `شريحة ${id}`, en: "" },
});

const lesson = (overrides: Partial<Lesson> = {}): Lesson => ({
  id: "tawheed",
  title: { ar: "التوحيد", en: "Tawheed" },
  description: { ar: "", en: "" },
  category: "aqeedah",
  published: true,
  slides: [slide("s1"), slide("s2"), slide("s3"), slide("s4")],
  ...overrides,
});

const NOW = 1_760_000_000_000;

describe("a Lesson's content", () => {
  it("accepts a Lesson with captioned image Slides", () => {
    const tawheed = lesson();

    expect(lessonSchema.parse(tawheed)).toStrictEqual(tawheed);
  });

  it("refuses a category that is not a Lesson category", () => {
    expect(
      lessonSchema.safeParse({ ...lesson(), category: "general" }).success
    ).toBeFalsy();
  });

  it("refuses a Slide whose image is not an uploaded file", () => {
    expect(
      lessonSchema.safeParse(
        lesson({
          slides: [{ ...slide("s1"), imageKey: "https://example.com/a.png" }],
        })
      ).success
    ).toBeFalsy();
  });

  it("refuses publishing a Lesson with no Slides, but keeps it as a draft", () => {
    expect(lessonSchema.safeParse(lesson({ slides: [] })).success).toBeFalsy();
    expect(
      lessonSchema.safeParse(lesson({ slides: [], published: false })).success
    ).toBeTruthy();
  });
});

describe(visibleLessons, () => {
  const fiqh = lesson({ id: "wudu", category: "fiqh" });
  const draft = lesson({ id: "draft", published: false });

  it("shows only published Lessons, in the Admins' order", () => {
    expect(visibleLessons([lesson(), draft, fiqh])).toStrictEqual([
      lesson(),
      fiqh,
    ]);
  });

  it("filters by category", () => {
    expect(visibleLessons([lesson(), draft, fiqh], "fiqh")).toStrictEqual([
      fiqh,
    ]);
    expect(visibleLessons([lesson(), fiqh], "history")).toStrictEqual([]);
  });
});

describe(viewSlide, () => {
  it("starts progress at the Slide the Believer sees", () => {
    expect(
      viewSlide(null, {
        lessonId: "tawheed",
        slide: 0,
        slideCount: 4,
        now: NOW,
      })
    ).toStrictEqual({
      progress: {
        lessonId: "tawheed",
        currentSlide: 0,
        furthestSlide: 0,
        completedAt: null,
        updatedAt: NOW,
      },
      completed: false,
    });
  });

  it("remembers where the Believer is and the furthest Slide they reached", () => {
    const { progress: atThird } = viewSlide(null, {
      lessonId: "tawheed",
      slide: 2,
      slideCount: 4,
      now: NOW,
    });
    const { progress: back } = viewSlide(atThird, {
      lessonId: "tawheed",
      slide: 1,
      slideCount: 4,
      now: NOW + 1,
    });

    expect(back).toMatchObject({ currentSlide: 1, furthestSlide: 2 });
  });

  it("completes the Lesson at its last Slide, once", () => {
    const first = viewSlide(null, {
      lessonId: "tawheed",
      slide: 3,
      slideCount: 4,
      now: NOW,
    });
    const again = viewSlide(first.progress, {
      lessonId: "tawheed",
      slide: 3,
      slideCount: 4,
      now: NOW + 5,
    });

    expect(first).toMatchObject({
      completed: true,
      progress: { completedAt: NOW },
    });
    expect(again).toMatchObject({
      completed: false,
      progress: { completedAt: NOW },
    });
  });

  it("keeps a completed Lesson completed when the Believer goes back", () => {
    const { progress } = viewSlide(null, {
      lessonId: "tawheed",
      slide: 3,
      slideCount: 4,
      now: NOW,
    });

    expect(
      viewSlide(progress, {
        lessonId: "tawheed",
        slide: 0,
        slideCount: 4,
        now: NOW + 1,
      }).progress
    ).toMatchObject({ currentSlide: 0, completedAt: NOW });
  });

  it("refuses a Slide the Lesson does not have", () => {
    expect(() =>
      viewSlide(null, {
        lessonId: "tawheed",
        slide: 4,
        slideCount: 4,
        now: NOW,
      })
    ).toThrow(RangeError);
    expect(() =>
      viewSlide(null, {
        lessonId: "tawheed",
        slide: -1,
        slideCount: 4,
        now: NOW,
      })
    ).toThrow(RangeError);
  });
});

describe(markLessonComplete, () => {
  it("completes the Lesson from any Slide", () => {
    const { progress } = viewSlide(null, {
      lessonId: "tawheed",
      slide: 1,
      slideCount: 4,
      now: NOW,
    });

    expect(markLessonComplete(progress, "tawheed", NOW + 1)).toStrictEqual({
      progress: { ...progress, completedAt: NOW + 1, updatedAt: NOW + 1 },
      completed: true,
    });
  });

  it("completes a Lesson never opened", () => {
    expect(markLessonComplete(null, "tawheed", NOW)).toMatchObject({
      completed: true,
      progress: { currentSlide: 0, furthestSlide: 0, completedAt: NOW },
    });
  });

  it("does not complete a Lesson twice", () => {
    const { progress } = markLessonComplete(null, "tawheed", NOW);

    expect(markLessonComplete(progress, "tawheed", NOW + 1)).toStrictEqual({
      progress,
      completed: false,
    });
  });
});

/** Progress of a Lesson the Believer opened and has not completed. */
const at = (furthestSlide: number, currentSlide = furthestSlide) =>
  ({
    lessonId: "tawheed",
    currentSlide,
    furthestSlide,
    completedAt: null,
    updatedAt: NOW,
  }) satisfies LessonProgress;

describe(lessonProgressSummary, () => {
  it("is empty for a Lesson never opened", () => {
    expect(lessonProgressSummary(null, 4)).toStrictEqual({
      status: "new",
      seen: 0,
      total: 4,
      fraction: 0,
      resumeAt: 0,
    });
  });

  it("counts against the Lesson's real number of Slides", () => {
    expect(lessonProgressSummary(at(2, 1), 4)).toStrictEqual({
      status: "in-progress",
      seen: 3,
      total: 4,
      fraction: 0.75,
      resumeAt: 1,
    });
    expect(lessonProgressSummary(at(2), 12)).toMatchObject({
      seen: 3,
      total: 12,
      fraction: 0.25,
    });
  });

  it("is full once completed, wherever the Believer stopped", () => {
    expect(
      lessonProgressSummary({ ...at(0), completedAt: NOW }, 4)
    ).toStrictEqual({
      status: "completed",
      seen: 4,
      total: 4,
      fraction: 1,
      resumeAt: 0,
    });
  });

  it("stays within the Lesson when Admins removed Slides", () => {
    expect(lessonProgressSummary(at(9), 4)).toStrictEqual({
      status: "in-progress",
      seen: 4,
      total: 4,
      fraction: 1,
      resumeAt: 3,
    });
  });

  it("has nothing to show for a Lesson without Slides", () => {
    expect(lessonProgressSummary(at(1), 0)).toMatchObject({
      seen: 0,
      total: 0,
      fraction: 0,
      resumeAt: 0,
    });
  });
});
