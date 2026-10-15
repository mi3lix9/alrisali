import { createQuranReaderSettingsRepository } from "@alrisali/db-user/quran";
import type {
  QuranReaderSettingsChange,
  QuranReaderSettingsRepository,
} from "@alrisali/db-user/quran";
import type { QuranReaderSettings } from "@alrisali/domain/quran";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import {
  getUserDatabase,
  USER_DATA_QUERY_KEY,
} from "@/shared/lib/user-database";

const READER_SETTINGS_KEY = [
  ...USER_DATA_QUERY_KEY,
  "quran",
  "reader-settings",
];

const repository = async (): Promise<QuranReaderSettingsRepository> => {
  const { db } = await getUserDatabase();
  return createQuranReaderSettingsRepository(db);
};

/** Page or Surah Mode, how pages turn, and the Surah Mode text size. */
export const useQuranReaderSettings = () =>
  useQuery({
    queryKey: READER_SETTINGS_KEY,
    queryFn: async (): Promise<QuranReaderSettings> => {
      const settings = await repository();
      return settings.get();
    },
  });

/** Saves a reader settings change; the reader and Settings follow it at once. */
export const useUpdateQuranReaderSettings = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (change: QuranReaderSettingsChange) => {
      const settings = await repository();
      return settings.update(change);
    },
    onMutate: async (change) => {
      await queryClient.cancelQueries({ queryKey: READER_SETTINGS_KEY });
      const previous =
        queryClient.getQueryData<QuranReaderSettings>(READER_SETTINGS_KEY);
      if (previous) {
        queryClient.setQueryData(READER_SETTINGS_KEY, {
          ...previous,
          ...change,
        });
      }
      return { previous };
    },
    onError: (_error, _change, context) => {
      if (context?.previous) {
        queryClient.setQueryData(READER_SETTINGS_KEY, context.previous);
      }
    },
    onSettled: async () => {
      await queryClient.invalidateQueries({ queryKey: READER_SETTINGS_KEY });
    },
  });
};
