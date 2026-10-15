import { createLessonProgressRepository } from "@alrisali/db-user/lessons";
import type {
  LessonProgress,
  LessonProgressChange,
} from "@alrisali/domain/lessons";
import { useMutation, useQuery } from "@tanstack/react-query";

import { events } from "@/shared/lib/events";
import { queryClient } from "@/shared/lib/orpc";
import {
  getUserDatabase,
  USER_DATA_QUERY_KEY,
} from "@/shared/lib/user-database";

const PROGRESS_QUERY_KEY = [...USER_DATA_QUERY_KEY, "lessons"];

// Progress writes read the saved row first, so they run one at a time:
// a quick swipe never saves an older Slide over a newer one.
const PROGRESS_SCOPE = { id: "lesson-progress" };

const progressRepository = async () => {
  const { db } = await getUserDatabase();
  return createLessonProgressRepository(db);
};

/** The Believer's progress in every Lesson they opened, by Lesson id. */
export const useLessonProgress = () =>
  useQuery({
    queryKey: PROGRESS_QUERY_KEY,
    queryFn: async (): Promise<Record<string, LessonProgress>> => {
      const lessons = await progressRepository();
      const all = await lessons.all();
      return Object.fromEntries(all.map((row) => [row.lessonId, row]));
    },
  });

const saved = async ({ progress, completed }: LessonProgressChange) => {
  if (completed && progress.completedAt !== null) {
    events.emit("LessonCompleted", {
      lessonId: progress.lessonId,
      completedAt: progress.completedAt,
    });
  }
  await queryClient.invalidateQueries({ queryKey: PROGRESS_QUERY_KEY });
};

/**
 * Saves the Slide the Believer sees; the last one completes the Lesson and
 * emits `LessonCompleted` (once per Lesson).
 */
export const useViewSlide = () =>
  useMutation({
    scope: PROGRESS_SCOPE,
    mutationFn: async (view: {
      lessonId: string;
      slide: number;
      slideCount: number;
    }) => {
      const lessons = await progressRepository();
      return lessons.viewSlide(view);
    },
    onSuccess: saved,
  });

/** Completes the Lesson from any Slide; emits `LessonCompleted` once. */
export const useMarkLessonComplete = () =>
  useMutation({
    scope: PROGRESS_SCOPE,
    mutationFn: async (lessonId: string) => {
      const lessons = await progressRepository();
      return lessons.markComplete(lessonId);
    },
    onSuccess: saved,
  });
