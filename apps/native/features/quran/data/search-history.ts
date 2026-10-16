import { createQuranSearchHistoryRepository } from "@alrisali/db-user/quran";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import {
  getUserDatabase,
  USER_DATA_QUERY_KEY,
} from "@/shared/lib/user-database";

const SEARCH_HISTORY_KEY = [...USER_DATA_QUERY_KEY, "quran", "search-history"];

const repository = async () => {
  const { db } = await getUserDatabase();
  return createQuranSearchHistoryRepository(db);
};

/** The last ten Quran searches, latest first. */
export const useQuranSearchHistory = () =>
  useQuery({
    queryKey: SEARCH_HISTORY_KEY,
    queryFn: async (): Promise<string[]> => {
      const history = await repository();
      return history.list();
    },
  });

/** Remembers a search, or forgets all of them (`query: null`). */
export const useChangeQuranSearchHistory = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (query: string | null) => {
      const history = await repository();
      await (query === null ? history.clear() : history.record(query));
    },
    onSettled: async () => {
      await queryClient.invalidateQueries({ queryKey: SEARCH_HISTORY_KEY });
    },
  });
};
