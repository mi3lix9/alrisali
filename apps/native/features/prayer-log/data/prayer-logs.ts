import { createPrayerLogRepository } from "@alrisali/db-user/prayer-log";
import type { PrayerLogRepository } from "@alrisali/db-user/prayer-log";
import { setSalahPerformed } from "@alrisali/domain/prayer-log";
import type { PrayerLog } from "@alrisali/domain/prayer-log";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Temporal } from "temporal-polyfill";

import { events } from "@/shared/lib/events";
import { queryClient } from "@/shared/lib/orpc";
import {
  getUserDatabase,
  USER_DATA_QUERY_KEY,
} from "@/shared/lib/user-database";

import { emitSalahChange } from "../utils/salah-change-events";
import type { SalahChange } from "../utils/salah-change-events";

const PRAYER_LOGS_QUERY_KEY = [...USER_DATA_QUERY_KEY, "prayer-log", "logs"];

const prayerLogs = async (): Promise<PrayerLogRepository> => {
  const { db } = await getUserDatabase();
  return createPrayerLogRepository(db);
};

/** Every Prayer Log, oldest first: the Prayer Streak is derived from them. */
export const usePrayerLogs = () =>
  useQuery({
    queryKey: PRAYER_LOGS_QUERY_KEY,
    queryFn: async (): Promise<PrayerLog[]> => {
      const repository = await prayerLogs();
      return repository.logs();
    },
  });

/** The logs with one Salah ticked or un-ticked, a new date added in order. */
const applyChange = (
  logs: readonly PrayerLog[],
  { date, salah, performed }: SalahChange
): PrayerLog[] => {
  const others = logs.filter((log) => !log.date.equals(date));
  const current = logs.find((log) => log.date.equals(date)) ?? {
    date,
    performed: [],
  };
  return [...others, setSalahPerformed(current, salah, performed)].toSorted(
    (first, second) => Temporal.PlainDate.compare(first.date, second.date)
  );
};

/**
 * Ticks or un-ticks one Salah. The change shows at once (so the Prayer Streak
 * follows an edit instantly) and is rolled back if saving fails. A saved tick
 * emits `SalahLogged`, a saved un-tick `SalahUnlogged`.
 */
export const useSetSalahPerformed = () =>
  useMutation({
    mutationFn: async (change: SalahChange): Promise<PrayerLog> => {
      const repository = await prayerLogs();
      return repository.setPerformed({
        ...change,
        today: Temporal.Now.plainDateISO(),
        at: new Date(),
      });
    },
    onMutate: async (change) => {
      await queryClient.cancelQueries({ queryKey: PRAYER_LOGS_QUERY_KEY });
      const previous = queryClient.getQueryData<PrayerLog[]>(
        PRAYER_LOGS_QUERY_KEY
      );
      queryClient.setQueryData<PrayerLog[]>(PRAYER_LOGS_QUERY_KEY, (logs) =>
        applyChange(logs ?? [], change)
      );
      return { previous };
    },
    onError: (_error, _change, context) => {
      queryClient.setQueryData(PRAYER_LOGS_QUERY_KEY, context?.previous);
    },
    onSuccess: (_log, change) => {
      emitSalahChange(events, change, Date.now());
    },
    onSettled: async () => {
      await queryClient.invalidateQueries({ queryKey: PRAYER_LOGS_QUERY_KEY });
    },
  });
