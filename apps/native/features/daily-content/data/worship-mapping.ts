import { createWorshipMappingRepository } from "@alrisali/db-content/daily-content";
import { useQuery } from "@tanstack/react-query";

import {
  CONTENT_QUERY_KEY,
  getContentReplica,
} from "@/shared/lib/content-database";

/**
 * The ziyarah, night-dua and every-day mapping from the device's content
 * replica: offline it is whatever the last pull brought (nothing before the
 * first).
 */
export const useWorshipMapping = () =>
  useQuery({
    queryKey: [...CONTENT_QUERY_KEY, "worship-mapping"],
    queryFn: async () => {
      const replica = await getContentReplica();
      return createWorshipMappingRepository(replica.db).all();
    },
  });
