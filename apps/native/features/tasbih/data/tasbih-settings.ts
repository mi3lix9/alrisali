import { createTasbihSettingsRepository } from "@alrisali/db-user/tasbih";
import type { TasbihSettings } from "@alrisali/domain/tasbih";
import { captureException } from "@sentry/react-native";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import {
  getUserDatabase,
  USER_DATA_QUERY_KEY,
} from "@/shared/lib/user-database";

const SETTINGS_QUERY_KEY = [...USER_DATA_QUERY_KEY, "tasbih", "settings"];

const repository = async () => {
  const { db } = await getUserDatabase();
  return createTasbihSettingsRepository(db);
};

/** The Believer's Tasbih choices (the feedback mode), from their database. */
export const useTasbihSettings = () =>
  useQuery({
    queryKey: SETTINGS_QUERY_KEY,
    queryFn: async (): Promise<TasbihSettings> => {
      const settings = await repository();
      return settings.settings();
    },
  });

/**
 * Saves a Tasbih choice. The next tap already follows it: the change shows
 * at once and goes back if the save fails.
 */
export const useUpdateTasbihSettings = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (change: Partial<TasbihSettings>) => {
      const settings = await repository();
      return settings.update(change);
    },
    onMutate: async (change) => {
      await queryClient.cancelQueries({ queryKey: SETTINGS_QUERY_KEY });
      const previous =
        queryClient.getQueryData<TasbihSettings>(SETTINGS_QUERY_KEY);
      if (previous) {
        queryClient.setQueryData(SETTINGS_QUERY_KEY, {
          ...previous,
          ...change,
        });
      }
      return { previous };
    },
    onError: (error, _change, context) => {
      captureException(error);
      if (context?.previous) {
        queryClient.setQueryData(SETTINGS_QUERY_KEY, context.previous);
      }
    },
    onSuccess: (settings) => {
      queryClient.setQueryData(SETTINGS_QUERY_KEY, settings);
    },
  });
};
