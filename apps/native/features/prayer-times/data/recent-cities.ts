import { createPrayerTimesRepository } from "@alrisali/db-user/prayer-times";
import type { Location, RecentCity } from "@alrisali/domain/shared";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import {
  getUserDatabase,
  USER_DATA_QUERY_KEY,
} from "@/shared/lib/user-database";

const RECENT_QUERY_KEY = [...USER_DATA_QUERY_KEY, "prayer-times", "recent"];

const repository = async () => {
  const { db } = await getUserDatabase();
  return createPrayerTimesRepository(db);
};

/** The Believer's Recent Cities, each with its time zone. */
export const useRecentCities = () =>
  useQuery({
    queryKey: RECENT_QUERY_KEY,
    queryFn: async (): Promise<RecentCity[]> => {
      const prayerTimes = await repository();
      return prayerTimes.recentCities();
    },
  });

/** Puts a city the Believer chose first in their Recent Cities. */
export const useRememberCity = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (location: Location) => {
      const prayerTimes = await repository();
      return prayerTimes.rememberCity(location);
    },
    onSuccess: (recent) => {
      queryClient.setQueryData(RECENT_QUERY_KEY, recent);
    },
  });
};
