import { AMAL } from "@alrisali/content/books";
import type { AmalEntry } from "@alrisali/content/books";
import { createAmalRepository } from "@alrisali/db-content/books";
import { useQuery } from "@tanstack/react-query";

import {
  CONTENT_QUERY_KEY,
  getContentReplica,
} from "@/shared/lib/content-database";

/**
 * The A'mal index from the device's content replica, which Admins manage.
 * Until the replica has pulled it (a first launch, or the pull from before
 * the index was published) the index bundled with the app stands in.
 */
export const useAmal = (): readonly AmalEntry[] => {
  const { data } = useQuery({
    queryKey: [...CONTENT_QUERY_KEY, "amal"],
    queryFn: async () => {
      const replica = await getContentReplica();
      return createAmalRepository(replica.db).all();
    },
  });
  return data ?? AMAL;
};
