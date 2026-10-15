import { fileUrl } from "@alrisali/api/shared";
import { createLessonsRepository } from "@alrisali/db-content/lessons";
import type { Lesson, Slide } from "@alrisali/domain/lessons";
import { useQuery } from "@tanstack/react-query";

import {
  CONTENT_QUERY_KEY,
  getContentReplica,
} from "@/shared/lib/content-database";
import { ENV } from "@/src/env";

// Every published Lesson with its Slides from the content replica, in the
// Admins' order; empty until the first pull.
const lessonsQuery = {
  queryKey: [...CONTENT_QUERY_KEY, "lessons"],
  queryFn: async (): Promise<Lesson[]> => {
    const replica = await getContentReplica();
    return createLessonsRepository(replica.db).list();
  },
};

export const useLessons = () => useQuery(lessonsQuery);

/** One published Lesson, or null when there is none (or it was unpublished). */
export const useLesson = (id: string) =>
  useQuery({
    ...lessonsQuery,
    select: (lessons) => lessons.find((lesson) => lesson.id === id) ?? null,
  });

/** Where a Slide's image loads from (the server redirects to the file). */
export const slideImageUrl = (slide: Slide): string =>
  fileUrl(ENV.EXPO_PUBLIC_SERVER_URL, slide.imageKey);
