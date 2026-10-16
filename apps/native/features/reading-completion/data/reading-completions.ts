import { createReadingCompletionsRepository } from "@alrisali/db-user/reading-completion";
import type { ReadingCompletion } from "@alrisali/domain/reading-completion";
import { useMutation, useQuery } from "@tanstack/react-query";

import { events } from "@/shared/lib/events";
import { queryClient } from "@/shared/lib/orpc";
import {
  getUserDatabase,
  USER_DATA_QUERY_KEY,
} from "@/shared/lib/user-database";

const COMPLETIONS_QUERY_KEY = [...USER_DATA_QUERY_KEY, "reading-completion"];

/** Whether the Believer marked the Supplication read on the day. */
export const useIsRead = ({ supplicationId, date }: ReadingCompletion) =>
  useQuery({
    queryKey: [...COMPLETIONS_QUERY_KEY, date],
    queryFn: async () => {
      const { db } = await getUserDatabase();
      return createReadingCompletionsRepository(db).readOn(date);
    },
    select: (read) => read.includes(supplicationId),
  });

/** Marks a Supplication read on a day, or undoes the mark. */
export const useSetRead = () =>
  useMutation({
    mutationFn: async ({
      completion,
      read,
    }: {
      completion: ReadingCompletion;
      read: boolean;
    }) => {
      const { db } = await getUserDatabase();
      const completions = createReadingCompletionsRepository(db);
      await (read
        ? completions.markRead(completion)
        : completions.unmarkRead(completion));
    },
    onSuccess: async (_result, { completion, read }) => {
      if (read) {
        events.emit("ReadingCompleted", {
          ...completion,
          completedAt: Date.now(),
        });
      }
      await queryClient.invalidateQueries({
        queryKey: COMPLETIONS_QUERY_KEY,
      });
    },
  });
