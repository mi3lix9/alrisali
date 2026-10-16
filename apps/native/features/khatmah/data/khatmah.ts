import { createKhatmahRepository } from "@alrisali/db-user/khatmah";
import type {
  KhatmahDraft,
  KhatmahRepository,
} from "@alrisali/db-user/khatmah";
import type { Khatmah, KhatmahLog } from "@alrisali/domain/khatmah";
import { useMutation, useQuery } from "@tanstack/react-query";
import { randomUUID } from "expo-crypto";

import { events } from "@/shared/lib/events";
import { queryClient } from "@/shared/lib/orpc";
import {
  getUserDatabase,
  USER_DATA_QUERY_KEY,
} from "@/shared/lib/user-database";

const KHATMAH_QUERY_KEY = [...USER_DATA_QUERY_KEY, "khatmah"];

const khatmahRepository = async (): Promise<KhatmahRepository> => {
  const { db } = await getUserDatabase();
  return createKhatmahRepository(db);
};

export interface KhatmahData {
  /** Every Khatmah, oldest first. */
  khatmahs: Khatmah[];
  /** Every Khatmah Log, oldest first. */
  logs: KhatmahLog[];
}

/** The Believer's Khatmahs and their logs. */
export const useKhatmahData = () =>
  useQuery({
    queryKey: KHATMAH_QUERY_KEY,
    queryFn: async (): Promise<KhatmahData> => {
      const repository = await khatmahRepository();
      const [khatmahs, logs] = await Promise.all([
        repository.list(),
        repository.logs(),
      ]);
      return { khatmahs, logs };
    },
  });

const invalidateKhatmah = () =>
  queryClient.invalidateQueries({ queryKey: KHATMAH_QUERY_KEY });

/** Starts a Khatmah; the caller catches validation errors. */
export const useCreateKhatmah = () =>
  useMutation({
    mutationFn: async (draft: KhatmahDraft): Promise<Khatmah> => {
      const repository = await khatmahRepository();
      return repository.create(randomUUID(), draft, new Date());
    },
    onSettled: invalidateKhatmah,
  });

export const useSetKhatmahReminder = () =>
  useMutation({
    mutationFn: async ({
      id,
      reminderAt,
    }: {
      id: string;
      reminderAt: number | null;
    }): Promise<void> => {
      const repository = await khatmahRepository();
      await repository.setReminder(id, reminderAt);
    },
    onSettled: invalidateKhatmah,
  });

export const useRemoveKhatmah = () =>
  useMutation({
    mutationFn: async (id: string): Promise<void> => {
      const repository = await khatmahRepository();
      await repository.remove(id);
    },
    onSettled: invalidateKhatmah,
  });

/**
 * Records a completed Khatmah Session. The change shows at once and is rolled
 * back if saving fails. A saved completion emits `KhatmahSessionCompleted`.
 */
export const useCompleteKhatmahSession = () =>
  useMutation({
    mutationFn: async (log: KhatmahLog): Promise<void> => {
      const repository = await khatmahRepository();
      await repository.log(log, new Date());
    },
    onMutate: async (log) => {
      await queryClient.cancelQueries({ queryKey: KHATMAH_QUERY_KEY });
      const previous = queryClient.getQueryData<KhatmahData>(KHATMAH_QUERY_KEY);
      queryClient.setQueryData<KhatmahData>(KHATMAH_QUERY_KEY, (data) =>
        data
          ? {
              khatmahs: data.khatmahs,
              logs: [
                ...data.logs.filter(
                  ({ khatmahId, session }) =>
                    !(khatmahId === log.khatmahId && session === log.session)
                ),
                log,
              ],
            }
          : data
      );
      return { previous };
    },
    onError: (_error, _log, context) => {
      queryClient.setQueryData(KHATMAH_QUERY_KEY, context?.previous);
    },
    onSuccess: (_result, log) => {
      events.emit("KhatmahSessionCompleted", {
        khatmahId: log.khatmahId,
        session: log.session,
        date: log.date.toString(),
        completedAt: Date.now(),
      });
    },
    onSettled: invalidateKhatmah,
  });
