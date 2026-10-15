import { createMoodCheckInRepository } from "@alrisali/db-user/mood";
import type {
  MoodCheckIn,
  MoodCheckInRepository,
} from "@alrisali/db-user/mood";
import { pickRemedy } from "@alrisali/domain/mood";
import type { Mood } from "@alrisali/domain/mood";
import { useMutation, useQuery } from "@tanstack/react-query";
import { randomUUID } from "expo-crypto";

import { queryClient } from "@/shared/lib/orpc";
import {
  getUserDatabase,
  USER_DATA_QUERY_KEY,
} from "@/shared/lib/user-database";

const MOOD_QUERY_KEY = [...USER_DATA_QUERY_KEY, "mood"];

const moodCheckIns = async (): Promise<MoodCheckInRepository> => {
  const { db } = await getUserDatabase();
  return createMoodCheckInRepository(db);
};

/**
 * The Believer's Mood Check-in made today, or null: a new day asks again.
 * The latest one decides, so checking in twice keeps the newer answer.
 */
export const useTodaysMoodCheckIn = () =>
  useQuery({
    queryKey: [...MOOD_QUERY_KEY, "latest"],
    queryFn: async (): Promise<MoodCheckIn | null> => {
      const repository = await moodCheckIns();
      return repository.latest();
    },
    select: (latest) =>
      latest && latest.checkedInAt.toDateString() === new Date().toDateString()
        ? latest
        : null,
  });

/** Records how the Believer feels, answered with one of the mood's Remedies. */
export const useCheckIn = () =>
  useMutation({
    mutationFn: async (mood: Mood): Promise<MoodCheckIn> => {
      const repository = await moodCheckIns();
      return repository.record({
        id: randomUUID(),
        mood,
        remedyId: pickRemedy(mood).id,
        checkedInAt: new Date(),
      });
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: MOOD_QUERY_KEY });
    },
  });
