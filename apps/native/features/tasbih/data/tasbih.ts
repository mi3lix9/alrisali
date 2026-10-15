import { createTasbihRepository } from "@alrisali/db-user/tasbih";
import type { TasbihRepository } from "@alrisali/db-user/tasbih";
import type {
  DhikrSession,
  TasbihAlZahraProgress,
} from "@alrisali/domain/tasbih";
import { useQuery } from "@tanstack/react-query";

import { queryClient } from "@/shared/lib/orpc";
import {
  getUserDatabase,
  USER_DATA_QUERY_KEY,
} from "@/shared/lib/user-database";

const TASBIH_QUERY_KEY = [...USER_DATA_QUERY_KEY, "tasbih"];
const TASBIH_AL_ZAHRA_QUERY_KEY = [...TASBIH_QUERY_KEY, "tasbih-al-zahra"];
const DHIKR_SESSIONS_QUERY_KEY = [...TASBIH_QUERY_KEY, "dhikr-sessions"];

const tasbihRepository = async (): Promise<TasbihRepository> => {
  const { db } = await getUserDatabase();
  return createTasbihRepository(db);
};

/** Tasbih al-Zahra's saved progress, as of the last save or pull. */
export const useSavedTasbihAlZahraProgress = () =>
  useQuery({
    queryKey: TASBIH_AL_ZAHRA_QUERY_KEY,
    queryFn: async (): Promise<TasbihAlZahraProgress> => {
      const repository = await tasbihRepository();
      return repository.getTasbihAlZahraProgress();
    },
  });

/**
 * Saves the progress the counter already shows. The cache takes it as is, so
 * a later read never moves the counter back.
 */
export const saveTasbihAlZahraProgress = async (
  progress: TasbihAlZahraProgress
): Promise<void> => {
  const repository = await tasbihRepository();
  await repository.saveTasbihAlZahraProgress(progress);
  queryClient.setQueryData(TASBIH_AL_ZAHRA_QUERY_KEY, progress);
};

export const recordDhikrSession = async (
  session: DhikrSession
): Promise<DhikrSession> => {
  const repository = await tasbihRepository();
  const recorded = await repository.recordDhikrSession(session);
  await queryClient.invalidateQueries({ queryKey: DHIKR_SESSIONS_QUERY_KEY });
  return recorded;
};
