import { createPrayerAssistantRepository } from "@alrisali/db-user/prayer-assistant";
import type { PrayerAssistantSettings } from "@alrisali/domain/prayer-assistant";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import {
  getUserDatabase,
  USER_DATA_QUERY_KEY,
} from "@/shared/lib/user-database";

const SETTINGS_QUERY_KEY = [
  ...USER_DATA_QUERY_KEY,
  "prayer-assistant",
  "settings",
];

const repository = async () => {
  const { db } = await getUserDatabase();
  return createPrayerAssistantRepository(db);
};

/** The Believer's Pace and bow sensitivity, from their database. */
export const usePrayerAssistantSettings = () =>
  useQuery({
    queryKey: SETTINGS_QUERY_KEY,
    queryFn: async (): Promise<PrayerAssistantSettings> => {
      const assistant = await repository();
      return assistant.settings();
    },
  });

/** Saves a Pace or bow sensitivity change for the next Salah too. */
export const useUpdatePrayerAssistantSettings = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (change: Partial<PrayerAssistantSettings>) => {
      const assistant = await repository();
      return assistant.update(change);
    },
    onSuccess: (settings) => {
      queryClient.setQueryData(SETTINGS_QUERY_KEY, settings);
    },
  });
};
