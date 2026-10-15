import { createDailyContentRepository } from "@alrisali/db-content/daily-content";
import { useQuery } from "@tanstack/react-query";

import {
  CONTENT_QUERY_KEY,
  getContentReplica,
} from "@/shared/lib/content-database";

/**
 * The Daily Content map from the device's content replica: offline it is
 * whatever the last pull brought (nothing before the first). Refreshed when
 * a pull brings changes.
 */
export const useDailyContent = () =>
  useQuery({
    queryKey: [...CONTENT_QUERY_KEY, "daily-content"],
    queryFn: async () => {
      const replica = await getContentReplica();
      return createDailyContentRepository(replica.db).all();
    },
  });
