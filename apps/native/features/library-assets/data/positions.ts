import { createLibraryAssetPositionsRepository } from "@alrisali/db-user/library-assets";
import { useQuery } from "@tanstack/react-query";

import { queryClient } from "@/shared/lib/orpc";
import {
  getUserDatabase,
  USER_DATA_QUERY_KEY,
} from "@/shared/lib/user-database";

const positionQueryKey = (assetId: string) => [
  ...USER_DATA_QUERY_KEY,
  "library-asset-position",
  assetId,
];

/** Where the Believer stopped in the Library Asset; null if never opened. */
export const useSavedPosition = (assetId: string) =>
  useQuery({
    queryKey: positionQueryKey(assetId),
    queryFn: async (): Promise<number | null> => {
      const { db } = await getUserDatabase();
      return createLibraryAssetPositionsRepository(db).position(assetId);
    },
  });

/** Saves where the Believer is in the Library Asset (synced like any user data). */
export const savePosition = async (
  assetId: string,
  position: number
): Promise<void> => {
  const { db } = await getUserDatabase();
  await createLibraryAssetPositionsRepository(db).save(assetId, position);
  queryClient.setQueryData(positionQueryKey(assetId), position);
};
