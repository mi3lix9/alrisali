import { createPrayerTimesRepository } from "@alrisali/db-user/prayer-times";
import type { PrayerTimeName } from "@alrisali/domain/shared";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import {
  getUserDatabase,
  USER_DATA_QUERY_KEY,
} from "@/shared/lib/user-database";

const HIDDEN_QUERY_KEY = [...USER_DATA_QUERY_KEY, "prayer-times", "hidden"];

const repository = async () => {
  const { db } = await getUserDatabase();
  return createPrayerTimesRepository(db);
};

/** The Believer's Hidden Prayer Times, from their database. */
export const useHiddenPrayerTimes = () =>
  useQuery({
    queryKey: HIDDEN_QUERY_KEY,
    queryFn: async (): Promise<PrayerTimeName[]> => {
      const prayerTimes = await repository();
      return prayerTimes.hiddenPrayerTimes();
    },
  });

/** Shows or hides one Prayer Time on the timetable and the countdown. */
export const useSetPrayerTimeVisible = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      name,
      visible,
    }: {
      name: PrayerTimeName;
      visible: boolean;
    }) => {
      const prayerTimes = await repository();
      return prayerTimes.setVisible(name, visible);
    },
    onSuccess: (hidden) => {
      queryClient.setQueryData(HIDDEN_QUERY_KEY, hidden);
    },
  });
};
