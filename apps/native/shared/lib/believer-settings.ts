import { createBelieverSettingsRepository } from "@alrisali/db-user/shared";
import type {
  BelieverSettings,
  BelieverSettingsChange,
  BelieverSettingsRepository,
} from "@alrisali/db-user/shared";
import { useMutation, useQuery } from "@tanstack/react-query";

import { queryClient } from "./orpc";
import { getUserDatabase, USER_DATA_QUERY_KEY } from "./user-database";

const SETTINGS_QUERY_KEY = [...USER_DATA_QUERY_KEY, "believer-settings"];

const settingsRepository = async (): Promise<BelieverSettingsRepository> => {
  const { db } = await getUserDatabase();
  return createBelieverSettingsRepository(db);
};

/** The saved settings as they are now, for work that outlives a render. */
export const readBelieverSettings = async (): Promise<BelieverSettings> => {
  const settings = await settingsRepository();
  return settings.get();
};

/** The Believer's location and Calculation Method, from their database. */
export const useBelieverSettings = () =>
  useQuery({
    queryKey: SETTINGS_QUERY_KEY,
    queryFn: readBelieverSettings,
  });

/** Saves a settings change and refreshes every reader of the settings. */
export const useUpdateBelieverSettings = () =>
  useMutation({
    mutationFn: async (change: BelieverSettingsChange) => {
      const settings = await settingsRepository();
      return settings.update(change);
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: SETTINGS_QUERY_KEY });
    },
  });
