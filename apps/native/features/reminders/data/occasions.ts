import { createOccasionsRepository } from "@alrisali/db-content/shared";
import { allOccasions, BUILT_IN_OCCASIONS } from "@alrisali/domain/shared";
import type { Occasion } from "@alrisali/domain/shared";
import { useQuery } from "@tanstack/react-query";

import {
  CONTENT_QUERY_KEY,
  getContentReplica,
} from "@/shared/lib/content-database";

/**
 * The Occasions the alerts may announce: the built-in ones, then those the
 * Admins published. Shares the calendar's query, so one pull refreshes both.
 */
export const useAlertOccasions = (): readonly Occasion[] => {
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
