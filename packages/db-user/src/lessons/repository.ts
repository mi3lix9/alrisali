import {
  lessonProgressSchema,
  markLessonComplete,
  viewSlide,
} from "@alrisali/domain/lessons";
import type {
  LessonProgress,
  LessonProgressChange,
} from "@alrisali/domain/lessons";
import { asc, eq } from "drizzle-orm";

import type { UserDb } from "../shared";
import { lessonProgress } from "./schema";

export interface LessonProgressRepository {
  /** Every Lesson the Believer opened or completed, by Lesson id. */
  all: () => Promise<LessonProgress[]>;
  /** Null for a Lesson never opened. */
  get: (lessonId: string) => Promise<LessonProgress | null>;
  /**
   * Saves that the Believer sees Slide `slide` (from 0) of a Lesson of
   * `slideCount` Slides; the last one completes the Lesson. `completed` is
   * true only when this view completed it.
   */
  viewSlide: (view: {
    lessonId: string;
    slide: number;
    slideCount: number;
  }) => Promise<LessonProgressChange>;
  /** Completes the Lesson; `completed` is false when it already was. */
  markComplete: (lessonId: string) => Promise<LessonProgressChange>;
}

export const createLessonProgressRepository = (
  db: UserDb,
  now: () => number = Date.now
): LessonProgressRepository => {
  const get = async (lessonId: string): Promise<LessonProgress | null> => {
    const row = await db
      .select()
      .from(lessonProgress)
      .where(eq(lessonProgress.lessonId, lessonId))
      .get();
    const parsed = lessonProgressSchema.safeParse(row);
    return parsed.success ? parsed.data : null;
  };

  const save = async (change: LessonProgressChange) => {
    await db.insert(lessonProgress).values(change.progress).onConflictDoUpdate({
      target: lessonProgress.lessonId,
      set: change.progress,
    });
    return change;
  };

  return {
    all: async () => {
      const rows = await db
        .select()
        .from(lessonProgress)
        .orderBy(asc(lessonProgress.lessonId));
      return rows.flatMap((row) => {
        const parsed = lessonProgressSchema.safeParse(row);
        return parsed.success ? [parsed.data] : [];
      });
    },
    get,
    viewSlide: async ({ lessonId, slide, slideCount }) =>
      save(
        viewSlide(await get(lessonId), {
          lessonId,
          slide,
          slideCount,
          now: now(),
        })
      ),
    markComplete: async (lessonId) => {
      const change = markLessonComplete(await get(lessonId), lessonId, now());
      return change.completed ? save(change) : change;
    },
  };
};
