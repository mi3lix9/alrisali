import { createOccasionAlertSettingsRepository } from "@alrisali/db-user/reminders";
import type {
  OccasionAlertSettings,
  OccasionAlertSettingsChange,
} from "@alrisali/domain/reminders";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import {
  getUserDatabase,
  USER_DATA_QUERY_KEY,
} from "@/shared/lib/user-database";

const SETTINGS_QUERY_KEY = [
  ...USER_DATA_QUERY_KEY,
  "reminders",
  "occasion-alerts",
];

const repository = async () => {
  const { db } = await getUserDatabase();
  return createOccasionAlertSettingsRepository(db);
};

/** Whether, when and for which types Occasions alert. */
export const useOccasionAlertSettings = () =>
  useQuery({
    queryKey: SETTINGS_QUERY_KEY,
    queryFn: async (): Promise<OccasionAlertSettings> => {
      const occasionAlerts = await repository();
      return occasionAlerts.get();
    },
  });

/** Saves a change; the scheduler reschedules as soon as the data changes. */
export const useUpdateOccasionAlertSettings = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (change: OccasionAlertSettingsChange) => {
      const occasionAlerts = await repository();
      return occasionAlerts.update(change);
    },
    onSuccess: (settings) => {
      queryClient.setQueryData(SETTINGS_QUERY_KEY, settings);
    },
  });
};
