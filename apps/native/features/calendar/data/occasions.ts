import { createOccasionsRepository } from "@alrisali/db-content/shared";
import { allOccasions, BUILT_IN_OCCASIONS } from "@alrisali/domain/shared";
import type { Occasion } from "@alrisali/domain/shared";
import { useQuery } from "@tanstack/react-query";

import {
  CONTENT_QUERY_KEY,
  getContentReplica,
} from "@/shared/lib/content-database";

/**
 * Every Occasion the calendar and Home show: the built-in ones, then those
 * the Admins published, from the content replica (refreshed by each pull
 * that brings changes). Only the built-in ones until the first pull.
 */
export const useOccasions = (): readonly Occasion[] => {
  const { data } = useQuery({
    queryKey: [...CONTENT_QUERY_KEY, "occasions"],
    queryFn: async () => {
      const replica = await getContentReplica();
      return createOccasionsRepository(replica.db).list();
    },
    select: allOccasions,
  });
  return data ?? BUILT_IN_OCCASIONS;
};
