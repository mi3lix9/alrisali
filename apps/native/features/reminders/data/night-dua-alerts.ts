import { createNightDuaAlertsRepository } from "@alrisali/db-user/reminders";
import type {
  NightDuaAlerts,
  NightDuaAlertsChange,
} from "@alrisali/domain/reminders";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import {
  getUserDatabase,
  USER_DATA_QUERY_KEY,
} from "@/shared/lib/user-database";

const NIGHT_DUA_QUERY_KEY = [...USER_DATA_QUERY_KEY, "reminders", "night-duas"];

const repository = async () => {
  const { db } = await getUserDatabase();
  return createNightDuaAlertsRepository(db);
};

/** Which night-dua Reminders the Believer turned on (all off at first). */
export const useNightDuaAlerts = () =>
  useQuery({
    queryKey: NIGHT_DUA_QUERY_KEY,
    queryFn: async (): Promise<NightDuaAlerts> => {
      const alerts = await repository();
      return alerts.get();
    },
  });

/** Saves a toggle; the scheduler reschedules as soon as the data changes. */
export const useUpdateNightDuaAlerts = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (change: NightDuaAlertsChange) => {
      const alerts = await repository();
      return alerts.update(change);
    },
    onSuccess: (alerts) => {
      queryClient.setQueryData(NIGHT_DUA_QUERY_KEY, alerts);
    },
  });
};
