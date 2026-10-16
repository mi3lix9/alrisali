import { createSupplicationPositionsRepository } from "@alrisali/db-user/books";
import type { SupplicationPosition } from "@alrisali/db-user/books";
import { useQuery } from "@tanstack/react-query";

import { queryClient } from "@/shared/lib/orpc";
import {
  getUserDatabase,
  USER_DATA_QUERY_KEY,
} from "@/shared/lib/user-database";

const positionQueryKey = (supplicationId: string) => [
  ...USER_DATA_QUERY_KEY,
  "supplication-position",
  supplicationId,
];

/** Where the Believer stopped in the Supplication; null if never saved. */
export const useSavedSupplicationPosition = (supplicationId: string) =>
  useQuery({
    queryKey: positionQueryKey(supplicationId),
    queryFn: async (): Promise<SupplicationPosition | null> => {
      const { db } = await getUserDatabase();
      return createSupplicationPositionsRepository(db).position(supplicationId);
    },
  });

/** Saves the section the Believer reached (synced like any user data). */
export const saveSupplicationSection = async (
  supplicationId: string,
  section: number
): Promise<void> => {
  const { db } = await getUserDatabase();
  await createSupplicationPositionsRepository(db).save(supplicationId, section);
  queryClient.setQueryData<SupplicationPosition>(
    positionQueryKey(supplicationId),
    { section, savedAt: new Date() }
  );
};
