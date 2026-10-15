import { createQuranLastReadRepository } from "@alrisali/db-user/quran";
import type { QuranLastRead } from "@alrisali/db-user/quran";
import type { AyahKey } from "@alrisali/domain/quran";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import {
  getUserDatabase,
  USER_DATA_QUERY_KEY,
} from "@/shared/lib/user-database";

const LAST_READ_KEY = [...USER_DATA_QUERY_KEY, "quran", "last-read"];

const repository = async () => {
  const { db } = await getUserDatabase();
  return createQuranLastReadRepository(db);
};

/** The Last-Read Ayah, or null before the Believer has read. */
export const useQuranLastRead = () =>
  useQuery({
    queryKey: LAST_READ_KEY,
    queryFn: async (): Promise<QuranLastRead | null> => {
      const lastRead = await repository();
      return lastRead.get();
    },
  });

/**
 * Saves the Last-Read Ayah. Continue reading, the reader's bookmark and the
 * ayah sheet follow it at once.
 */
export const useSetQuranLastRead = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (ayah: AyahKey) => {
      const lastRead = await repository();
      return lastRead.set(ayah);
    },
    onMutate: async (ayah) => {
      await queryClient.cancelQueries({ queryKey: LAST_READ_KEY });
      const previous = queryClient.getQueryData<QuranLastRead | null>(
        LAST_READ_KEY
      );
      queryClient.setQueryData<QuranLastRead>(LAST_READ_KEY, {
        ayah,
        setAt: new Date().toISOString(),
      });
      return { previous };
    },
    onError: (_error, _ayah, context) => {
      queryClient.setQueryData(LAST_READ_KEY, context?.previous ?? null);
    },
    onSettled: async () => {
      await queryClient.invalidateQueries({ queryKey: LAST_READ_KEY });
    },
  });
};
