import { z } from "zod";

/**
 * How far the Believer got through a Lesson. Slides are counted by position,
 * from 0. `completedAt` (epoch ms) is set once, at the last Slide or by Mark
 * complete, and never cleared, so a Lesson completes once.
 */
export const lessonProgressSchema = z.object({
  lessonId: z.string().min(1),
  /** The Slide the Believer was on, where the Lesson reopens. */
  currentSlide: z.number().int().min(0),
  /** The furthest Slide they reached. */
  furthestSlide: z.number().int().min(0),
  completedAt: z.number().int().nullable(),
  updatedAt: z.number().int(),
});

export type LessonProgress = z.infer<typeof lessonProgressSchema>;

/**
 * Progress after a change; `completed` is true only when this change
 * completed the Lesson (so Companion XP is awarded once).
 */
export interface LessonProgressChange {
  progress: LessonProgress;
  completed: boolean;
}

const started = (lessonId: string, now: number): LessonProgress => ({
  lessonId,
  currentSlide: 0,
  furthestSlide: 0,
  completedAt: null,
  updatedAt: now,
});

/**
 * The Believer sees Slide `slide` (from 0) of a Lesson of `slideCount`
 * Slides. Seeing the last one completes the Lesson.
 */
export const viewSlide = (
  progress: LessonProgress | null,
  {
    lessonId,
    slide,
    slideCount,
    now,
  }: { lessonId: string; slide: number; slideCount: number; now: number }
): LessonProgressChange => {
  if (!Number.isInteger(slide) || slide < 0 || slide >= slideCount) {
    throw new RangeError(
      `Slide ${slide} is not in a Lesson of ${slideCount} Slides`
    );
  }
  const before = progress ?? started(lessonId, now);
  const completed = before.completedAt === null && slide === slideCount - 1;
  return {
    progress: {
      ...before,
      currentSlide: slide,
      furthestSlide: Math.max(before.furthestSlide, slide),
      completedAt: completed ? now : before.completedAt,
      updatedAt: now,
    },
    completed,
  };
};

/** The Believer marks the Lesson complete, wherever they are in it. */
export const markLessonComplete = (
  progress: LessonProgress | null,
  lessonId: string,
  now: number
): LessonProgressChange => {
  if (progress && progress.completedAt !== null) {
    return { progress, completed: false };
  }
  return {
    progress: {
      ...(progress ?? started(lessonId, now)),
      completedAt: now,
      updatedAt: now,
    },
    completed: true,
  };
};

export type LessonStatus = "new" | "in-progress" | "completed";

/** What a device shows of a Lesson's progress. */
export interface LessonProgressSummary {
  status: LessonStatus;
  /** Slides reached, out of `total`: the Lesson's real number of Slides. */
  seen: number;
  total: number;
  /** 0 to 1. */
  fraction: number;
  /** The Slide to reopen at. */
  resumeAt: number;
}

/**
 * Progress against the Lesson's real number of Slides. Admins may remove
 * Slides after the Believer saw them, so positions are kept within it.
 */
export const lessonProgressSummary = (
  progress: LessonProgress | null,
  slideCount: number
): LessonProgressSummary => {
  const total = Math.max(0, slideCount);
  const last = Math.max(0, total - 1);
  const resumeAt = Math.min(progress?.currentSlide ?? 0, last);
  if (progress && progress.completedAt !== null) {
    return { status: "completed", seen: total, total, fraction: 1, resumeAt };
  }
  if (!progress || total === 0) {
    return { status: "new", seen: 0, total, fraction: 0, resumeAt };
  }
  const seen = Math.min(progress.furthestSlide + 1, total);
  return {
    status: "in-progress",
    seen,
    total,
    fraction: seen / total,
    resumeAt,
  };
};
