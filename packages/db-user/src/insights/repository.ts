import type { InsightsSources } from "@alrisali/domain/shared";

import type { InsightsSourceReaders, UserDb } from "../shared";

/*
 * Insights own no table and read none: each feature that records a source
 * reads its own tables (`src/<feature>/insights-source.ts`), and the caller
 * passes those readers in.
 */

export interface InsightsRepository {
  /**
   * Everything Insights are computed from. Moments (check-ins, Dhikr
   * Sessions, Habit creation) become dates in `timeZone`, the Believer's.
   */
  sources: (timeZone: string) => Promise<InsightsSources>;
}

export const createInsightsRepository = (
  db: UserDb,
  readers: InsightsSourceReaders
): InsightsRepository => ({
  sources: async (timeZone) => {
    const [
      prayerLogs,
      khushu,
      habits,
      habitCompletions,
      dhikrSessions,
      moodCheckIns,
    ] = await Promise.all([
      readers.prayerLogs(db, timeZone),
      readers.khushu(db, timeZone),
      readers.habits(db, timeZone),
      readers.habitCompletions(db, timeZone),
      readers.dhikrSessions(db, timeZone),
      readers.moodCheckIns(db, timeZone),
    ]);
    return {
      prayerLogs,
      khushu,
      habits,
      habitCompletions,
      dhikrSessions,
      moodCheckIns,
    };
  },
});
