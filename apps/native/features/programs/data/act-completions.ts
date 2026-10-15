import { createActCompletionsRepository } from "@alrisali/db-user/programs";
import type {
  ActCompletion,
  ActCompletionsRepository,
} from "@alrisali/db-user/programs";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Temporal } from "temporal-polyfill";

import { events } from "@/shared/lib/events";
import { queryClient } from "@/shared/lib/orpc";
import {
  getUserDatabase,
  USER_DATA_QUERY_KEY,
} from "@/shared/lib/user-database";

const ACT_COMPLETIONS_QUERY_KEY = [...USER_DATA_QUERY_KEY, "act-completions"];

const queryKeyOn = (date: Temporal.PlainDate) => [
  ...ACT_COMPLETIONS_QUERY_KEY,
  date.toString(),
];

const actCompletions = async (): Promise<ActCompletionsRepository> => {
  const { db } = await getUserDatabase();
  return createActCompletionsRepository(db);
};

/** The Act Completions on one date. */
export const useActCompletionsOn = (date: Temporal.PlainDate) =>
  useQuery({
    queryKey: queryKeyOn(date),
    queryFn: async (): Promise<ActCompletion[]> => {
      const repository = await actCompletions();
      return repository.completionsOn(date);
    },
  });

export interface ActTick {
  programId: string;
  actId: string;
  date: Temporal.PlainDate;
  completed: boolean;
}

/**
 * Completes an Act for a date, or undoes it. The change shows at once and is
 * rolled back if saving fails. A completion emits `ActCompleted`.
 */
export const useSetActCompleted = () =>
  useMutation({
    mutationFn: async (tick: ActTick): Promise<void> => {
      const repository = await actCompletions();
      await repository.setCompleted({
        ...tick,
        today: Temporal.Now.plainDateISO(),
        at: new Date(),
      });
    },
    onMutate: async (tick) => {
      const queryKey = queryKeyOn(tick.date);
      await queryClient.cancelQueries({ queryKey });
      const previous = queryClient.getQueryData<ActCompletion[]>(queryKey);
      if (previous) {
        const others = previous.filter(
          ({ programId, actId }) =>
            programId !== tick.programId || actId !== tick.actId
        );
        queryClient.setQueryData<ActCompletion[]>(
          queryKey,
          tick.completed
            ? [
                ...others,
                {
                  programId: tick.programId,
                  actId: tick.actId,
                  date: tick.date,
                },
              ]
            : others
        );
      }
      return { previous };
    },
    onError: (_error, tick, context) => {
      queryClient.setQueryData(queryKeyOn(tick.date), context?.previous);
    },
    onSuccess: (_result, { programId, actId, date, completed }) => {
      if (completed) {
        events.emit("ActCompleted", {
          programId,
          actId,
          date: date.toString(),
          completedAt: Date.now(),
        });
      }
    },
    onSettled: () =>
      queryClient.invalidateQueries({ queryKey: ACT_COMPLETIONS_QUERY_KEY }),
  });
