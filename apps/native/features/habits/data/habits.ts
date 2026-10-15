import { createHabitRepository } from "@alrisali/db-user/habits";
import type {
  HabitCompletion,
  HabitRepository,
} from "@alrisali/db-user/habits";
import type { Habit, HabitDraft } from "@alrisali/domain/habits";
import { useMutation, useQuery } from "@tanstack/react-query";
import { randomUUID } from "expo-crypto";
import { Temporal } from "temporal-polyfill";

import { events } from "@/shared/lib/events";
import { queryClient } from "@/shared/lib/orpc";
import {
  getUserDatabase,
  USER_DATA_QUERY_KEY,
} from "@/shared/lib/user-database";

const HABITS_QUERY_KEY = [...USER_DATA_QUERY_KEY, "habits"];

const habitRepository = async (): Promise<HabitRepository> => {
  const { db } = await getUserDatabase();
  return createHabitRepository(db);
};

export interface HabitData {
  /** Every Habit, archived ones included, oldest first. */
  habits: Habit[];
  /** Every completion, oldest date first. */
  completions: HabitCompletion[];
}

/**
 * The Believer's Habits and their completions. The first read for a
 * Believer seeds the default Habits.
 */
export const useHabitData = () =>
  useQuery({
    queryKey: HABITS_QUERY_KEY,
    queryFn: async (): Promise<HabitData> => {
      const repository = await habitRepository();
      await repository.seedDefaults(new Date());
      const [habits, completions] = await Promise.all([
        repository.list(),
        repository.completions(),
      ]);
      return { habits, completions };
    },
  });

const invalidateHabits = () =>
  queryClient.invalidateQueries({ queryKey: HABITS_QUERY_KEY });

/** Saves a new Habit; the caller catches validation errors. */
export const useCreateHabit = () =>
  useMutation({
    mutationFn: async (draft: HabitDraft): Promise<Habit> => {
      const repository = await habitRepository();
      return repository.create(randomUUID(), draft, new Date());
    },
    onSuccess: invalidateHabits,
  });

export const useSetHabitArchived = () =>
  useMutation({
    mutationFn: async ({
      id,
      archived,
    }: {
      id: string;
      archived: boolean;
    }): Promise<void> => {
      const repository = await habitRepository();
      await repository.setArchived(id, archived, new Date());
    },
    onSettled: invalidateHabits,
  });

export const useRemoveHabit = () =>
  useMutation({
    mutationFn: async (id: string): Promise<void> => {
      const repository = await habitRepository();
      await repository.remove(id);
    },
    onSettled: invalidateHabits,
  });

export interface HabitTick {
  habitId: string;
  date: Temporal.PlainDate;
  completed: boolean;
}

/**
 * Ticks or un-ticks a Habit for a date. The change shows at once and is
 * rolled back if saving fails. A tick emits `HabitCompleted`.
 */
export const useSetHabitCompleted = () =>
  useMutation({
    mutationFn: async (tick: HabitTick): Promise<void> => {
      const repository = await habitRepository();
      await repository.setCompleted({
        ...tick,
        today: Temporal.Now.plainDateISO(),
        at: new Date(),
      });
    },
    onMutate: async ({ habitId, date, completed }) => {
      await queryClient.cancelQueries({ queryKey: HABITS_QUERY_KEY });
      const previous = queryClient.getQueryData<HabitData>(HABITS_QUERY_KEY);
      if (previous) {
        const others = previous.completions.filter(
          (completion) =>
            completion.habitId !== habitId || !completion.date.equals(date)
        );
        queryClient.setQueryData<HabitData>(HABITS_QUERY_KEY, {
          ...previous,
          completions: completed ? [...others, { habitId, date }] : others,
        });
      }
      return { previous };
    },
    onError: (_error, _tick, context) => {
      queryClient.setQueryData(HABITS_QUERY_KEY, context?.previous);
    },
    onSuccess: (_result, { habitId, date, completed }) => {
      if (completed) {
        events.emit("HabitCompleted", {
          habitId,
          date: date.toString(),
          completedAt: Date.now(),
        });
      }
    },
    onSettled: invalidateHabits,
  });
