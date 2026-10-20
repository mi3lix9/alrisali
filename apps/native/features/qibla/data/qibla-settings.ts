import { createQiblaSettingsRepository } from "@alrisali/db-user/qibla";
import type { QiblaSettings } from "@alrisali/db-user/qibla";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import {
  getUserDatabase,
  USER_DATA_QUERY_KEY,
} from "@/shared/lib/user-database";

const QIBLA_SETTINGS_KEY = [...USER_DATA_QUERY_KEY, "qibla", "settings"];

const repository = async () => {
  const { db } = await getUserDatabase();
  return createQiblaSettingsRepository(db);
};

/** What the compass points at: the Kaaba until a Shrine is chosen. */
export const useQiblaSettings = () =>
  useQuery({
    queryKey: QIBLA_SETTINGS_KEY,
    queryFn: async (): Promise<QiblaSettings> => {
      const settings = await repository();
      return settings.settings();
    },
  });

/** Saves a choice of target; the compass follows it at once. */
export const useUpdateQiblaSettings = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (change: Partial<QiblaSettings>) => {
      const settings = await repository();
      return settings.update(change);
    },
    onMutate: async (change) => {
      await queryClient.cancelQueries({ queryKey: QIBLA_SETTINGS_KEY });
      const previous =
        queryClient.getQueryData<QiblaSettings>(QIBLA_SETTINGS_KEY);
      if (previous) {
        queryClient.setQueryData(QIBLA_SETTINGS_KEY, {
          ...previous,
          ...change,
        });
      }
      return { previous };
    },
    onError: (_error, _change, context) => {
      if (context?.previous) {
        queryClient.setQueryData(QIBLA_SETTINGS_KEY, context.previous);
      }
    },
    onSettled: async () => {
      await queryClient.invalidateQueries({ queryKey: QIBLA_SETTINGS_KEY });
    },
  });
};
