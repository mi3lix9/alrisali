import { createInsightsRepository } from "@alrisali/db-user/insights";
import type { InsightsSourceReaders } from "@alrisali/db-user/shared";
import type { InsightsSources } from "@alrisali/domain/shared";
import { useQuery } from "@tanstack/react-query";
import { getCalendars } from "expo-localization";
import { Temporal } from "temporal-polyfill";

import {
  getUserDatabase,
  USER_DATA_QUERY_KEY,
} from "@/shared/lib/user-database";

/**
 * What Insights are computed from, read from this device's database (a
 * Guest's too) through each feature's reader. Other features' saves do not
 * invalidate this key, so it is read again every time Insights open.
 */
export const useInsightsSources = (readers: InsightsSourceReaders) =>
  useQuery({
    queryKey: [...USER_DATA_QUERY_KEY, "insights"],
    queryFn: async (): Promise<InsightsSources> => {
      const { db } = await getUserDatabase();
      const timeZone = getCalendars()[0]?.timeZone ?? Temporal.Now.timeZoneId();
      return createInsightsRepository(db, readers).sources(timeZone);
    },
    refetchOnMount: "always",
  });
