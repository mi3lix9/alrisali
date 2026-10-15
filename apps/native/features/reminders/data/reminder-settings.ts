import { createReminderSettingsRepository } from "@alrisali/db-user/reminders";
import type {
  ReminderSettings,
  ReminderSettingsChange,
} from "@alrisali/domain/reminders";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import {
  getUserDatabase,
  USER_DATA_QUERY_KEY,
} from "@/shared/lib/user-database";

const SETTINGS_QUERY_KEY = [...USER_DATA_QUERY_KEY, "reminders", "settings"];

const repository = async () => {
  const { db } = await getUserDatabase();
  return createReminderSettingsRepository(db);
};

/** Each Salah's and Imsak's Reminder rule, and the quiet hours. */
export const useReminderSettings = () =>
  useQuery({
    queryKey: SETTINGS_QUERY_KEY,
    queryFn: async (): Promise<ReminderSettings> => {
      const reminders = await repository();
      return reminders.get();
    },
  });

/** Saves a change; the scheduler reschedules as soon as the data changes. */
export const useUpdateReminderSettings = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (change: ReminderSettingsChange) => {
      const reminders = await repository();
      return reminders.update(change);
    },
    onSuccess: (settings) => {
      queryClient.setQueryData(SETTINGS_QUERY_KEY, settings);
    },
  });
};
