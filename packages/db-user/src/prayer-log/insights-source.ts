import { SALAH } from "@alrisali/domain/shared";
import type { LoggedDay } from "@alrisali/domain/shared";
import { sql } from "drizzle-orm";
import { Temporal } from "temporal-polyfill";

import type { InsightsSourceReader } from "../shared";

/** The Prayer Log as Insights read it: each date's Salah, in the day's order. */
export const readPrayerLogInsightsSource: InsightsSourceReader<
  LoggedDay
> = async (db) => {
  const rows = await db.values<[string, string]>(
    sql`SELECT date, salah FROM prayer_logs ORDER BY date`
  );
  const byDate = new Map<string, Set<string>>();
  for (const [day, salah] of rows) {
    byDate.set(day, (byDate.get(day) ?? new Set()).add(salah));
  }
  return [...byDate].map(([day, logged]) => ({
    date: Temporal.PlainDate.from(day),
    performed: SALAH.filter((salah) => logged.has(salah)),
  }));
};
