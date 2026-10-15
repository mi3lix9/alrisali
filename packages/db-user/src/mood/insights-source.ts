import type { MoodCheckInSource } from "@alrisali/domain/shared";
import { sql } from "drizzle-orm";

import { localDateOf } from "../shared";
import type { InsightsSourceReader } from "../shared";

/** Mood Check-ins as Insights read them, oldest first. */
export const readMoodCheckInsInsightsSource: InsightsSourceReader<
  MoodCheckInSource
> = async (db, timeZone) => {
  const rows = await db.values<[string, number]>(
    sql`SELECT mood, checked_in_at FROM mood_check_ins ORDER BY checked_in_at`
  );
  return rows.map(([mood, checkedInAt]) => ({
    mood,
    date: localDateOf(checkedInAt, timeZone),
  }));
};
