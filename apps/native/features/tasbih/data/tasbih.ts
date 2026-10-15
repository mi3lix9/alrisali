import { createTasbihRepository } from "@alrisali/db-user/tasbih";
import type {
  OpenTasbih,
  Tasbih,
  TasbihRepository,
} from "@alrisali/db-user/tasbih";
import type {
  DhikrSession,
  OpenTasbihDetailsInput,
  TasbihAlZahraProgress,
} from "@alrisali/domain/tasbih";
import { useQuery } from "@tanstack/react-query";
import { randomUUID } from "expo-crypto";

import { queryClient } from "@/shared/lib/orpc";
import {
  getUserDatabase,
  USER_DATA_QUERY_KEY,
} from "@/shared/lib/user-database";

const TASBIH_QUERY_KEY = [...USER_DATA_QUERY_KEY, "tasbih"];
const TASBIH_LIST_QUERY_KEY = [...TASBIH_QUERY_KEY, "list"];
const TASBIH_AL_ZAHRA_QUERY_KEY = [...TASBIH_QUERY_KEY, "tasbih-al-zahra"];
const OPEN_TASBIH_QUERY_KEY = [...TASBIH_QUERY_KEY, "open"];
const DHIKR_SESSIONS_QUERY_KEY = [...TASBIH_QUERY_KEY, "dhikr-sessions"];

const openTasbihQueryKey = (tasbihId: string) => [
  ...OPEN_TASBIH_QUERY_KEY,
  tasbihId,
];

const tasbihRepository = async (): Promise<TasbihRepository> => {
  const { db } = await getUserDatabase();
  return createTasbihRepository(db);
};

/** Every Tasbih, Tasbih al-Zahra first. */
export const useTasbihList = () =>
  useQuery({
    queryKey: TASBIH_LIST_QUERY_KEY,
    queryFn: async (): Promise<Tasbih[]> => {
      const repository = await tasbihRepository();
      return repository.list();
    },
  });

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

/**
 * An Open Tasbih as saved, or null once it is deleted (or never existed).
 * Reads nothing while `tasbihId` is undefined.
 */
export const useSavedOpenTasbih = (tasbihId: string | undefined) =>
  useQuery({
    queryKey: openTasbihQueryKey(tasbihId ?? ""),
    queryFn: async (): Promise<OpenTasbih | null> => {
      const repository = await tasbihRepository();
      return tasbihId ? repository.getOpenTasbih(tasbihId) : null;
    },
    enabled: tasbihId !== undefined,
  });

const setSavedOpenTasbihCount = (tasbihId: string, count: number): void => {
  queryClient.setQueryData<OpenTasbih | null>(
    openTasbihQueryKey(tasbihId),
    (saved) => (saved ? { ...saved, count } : saved)
  );
};

/** Creates an Open Tasbih and returns it. */
export const createOpenTasbih = async (
  details: OpenTasbihDetailsInput
): Promise<OpenTasbih> => {
  const repository = await tasbihRepository();
  const created = await repository.createOpenTasbih(randomUUID(), details);
  queryClient.setQueryData(openTasbihQueryKey(created.id), created);
  await queryClient.invalidateQueries({ queryKey: TASBIH_LIST_QUERY_KEY });
  return created;
};

export const editOpenTasbih = async (
  tasbihId: string,
  details: OpenTasbihDetailsInput
): Promise<void> => {
  const repository = await tasbihRepository();
  await repository.editOpenTasbih(tasbihId, details);
  await Promise.all([
    queryClient.invalidateQueries({ queryKey: TASBIH_LIST_QUERY_KEY }),
    queryClient.invalidateQueries({ queryKey: openTasbihQueryKey(tasbihId) }),
  ]);
};

export const removeOpenTasbih = async (tasbihId: string): Promise<void> => {
  const repository = await tasbihRepository();
  await repository.remove(tasbihId);
  queryClient.setQueryData(openTasbihQueryKey(tasbihId), null);
  await queryClient.invalidateQueries({ queryKey: TASBIH_LIST_QUERY_KEY });
};

/** Saves the count the counter already shows (see Tasbih al-Zahra's save). */
export const saveOpenTasbihCount = async (
  tasbihId: string,
  count: number
): Promise<void> => {
  const repository = await tasbihRepository();
  await repository.saveOpenTasbihCount(tasbihId, count);
  setSavedOpenTasbihCount(tasbihId, count);
};

/** Records the count as a Dhikr Session and starts the Open Tasbih over. */
export const saveOpenTasbihSession = async (
  session: DhikrSession
): Promise<DhikrSession> => {
  const repository = await tasbihRepository();
  const recorded = await repository.saveOpenTasbihSession(session);
  setSavedOpenTasbihCount(recorded.tasbihId, 0);
  await queryClient.invalidateQueries({ queryKey: DHIKR_SESSIONS_QUERY_KEY });
  return recorded;
};

/** Every Dhikr Session (newest first) and every Tasbih, read fresh. */
export const readDhikrHistory = async (): Promise<{
  sessions: DhikrSession[];
  tasbih: Tasbih[];
}> => {
  const repository = await tasbihRepository();
  const [sessions, tasbih] = await Promise.all([
    repository.listDhikrSessions(),
    repository.list(),
  ]);
  return { sessions, tasbih };
};
