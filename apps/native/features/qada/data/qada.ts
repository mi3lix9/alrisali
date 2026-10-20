import { createQadaRepository } from "@alrisali/db-user/qada";
import type { QadaRepository } from "@alrisali/db-user/qada";
import type { QadaLog, QadaPlan } from "@alrisali/domain/qada";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Temporal } from "temporal-polyfill";

import { events } from "@/shared/lib/events";
import { queryClient } from "@/shared/lib/orpc";
import {
  getUserDatabase,
  USER_DATA_QUERY_KEY,
} from "@/shared/lib/user-database";

const QADA_QUERY_KEY = [...USER_DATA_QUERY_KEY, "qada"];

const qadaRepository = async (): Promise<QadaRepository> => {
  const { db } = await getUserDatabase();
  return createQadaRepository(db);
};

export interface QadaData {
  /** Null until the Believer sets a plan up. */
  plan: QadaPlan | null;
  /** Every Qada Log, oldest first. */
  logs: QadaLog[];
}

/** The Believer's Qada Plan and Qada Logs. */
export const useQadaData = () =>
  useQuery({
    queryKey: QADA_QUERY_KEY,
    queryFn: async (): Promise<QadaData> => {
      const repository = await qadaRepository();
      const [plan, logs] = await Promise.all([
        repository.plan(),
        repository.logs(),
      ]);
      return { plan, logs };
    },
  });

const invalidateQada = () =>
  queryClient.invalidateQueries({ queryKey: QADA_QUERY_KEY });

/** Saves the whole plan; the caller catches validation errors. */
export const useSaveQadaPlan = () =>
  useMutation({
    mutationFn: async (plan: QadaPlan): Promise<QadaPlan> => {
      const repository = await qadaRepository();
      return repository.savePlan(plan, new Date());
    },
    onSettled: invalidateQada,
  });

/** One Qada Log recorded (`logged`) or removed. */
export interface QadaLogChange {
  log: QadaLog;
  logged: boolean;
}

/**
 * Records or removes one Qada Log. The change shows at once and is rolled
 * back if saving fails. A saved record emits `QadaLogged` (never
 * `SalahLogged`: a Qada Salah is not the day's Salah).
 */
export const useChangeQadaLog = () =>
  useMutation({
    mutationFn: async ({ log, logged }: QadaLogChange): Promise<void> => {
      const repository = await qadaRepository();
      await (logged
        ? repository.log(log, {
            today: Temporal.Now.plainDateISO(),
            at: new Date(),
          })
        : repository.unlog(log.id));
    },
    onMutate: async ({ log, logged }) => {
      await queryClient.cancelQueries({ queryKey: QADA_QUERY_KEY });
      const previous = queryClient.getQueryData<QadaData>(QADA_QUERY_KEY);
      queryClient.setQueryData<QadaData>(QADA_QUERY_KEY, (data) =>
        data
          ? {
              plan: data.plan,
              logs: [
                ...data.logs.filter(({ id }) => id !== log.id),
                ...(logged ? [log] : []),
              ],
            }
          : data
      );
      return { previous };
    },
    onError: (_error, _change, context) => {
      queryClient.setQueryData(QADA_QUERY_KEY, context?.previous);
    },
    onSuccess: (_result, { log, logged }) => {
      if (logged) {
        events.emit("QadaLogged", {
          logId: log.id,
          kind: log.kind,
          date: log.date.toString(),
          loggedAt: Date.now(),
        });
      }
    },
    onSettled: invalidateQada,
  });
