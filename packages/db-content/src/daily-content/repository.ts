import type { DailyContent, Weekday } from "@alrisali/domain/daily-content";
import { eq } from "drizzle-orm";

import { isMissingTable } from "../shared/content-db";
import type { ContentDb } from "../shared/content-db";
import { dailyContent } from "./schema";

export interface DailyContentRepository {
  /** Every weekday Admins chose a Supplication for; none while the replica has never pulled. */
  all: () => Promise<{ weekday: string; supplicationId: string }[]>;
  /** Features a Supplication on a weekday (the server only; replicas refuse). */
  set: (entry: DailyContent) => Promise<void>;
  /** Features nothing on a weekday (the server only; replicas refuse). */
  clear: (weekday: Weekday) => Promise<void>;
}

export const createDailyContentRepository = (
  db: ContentDb
): DailyContentRepository => ({
  all: async () => {
    try {
      return await db
        .select({
          weekday: dailyContent.weekday,
          supplicationId: dailyContent.supplicationId,
        })
        .from(dailyContent);
    } catch (error) {
      if (isMissingTable(error)) {
        return [];
      }
      throw error;
    }
  },
  set: async ({ weekday, supplicationId }) => {
    await db
      .insert(dailyContent)
      .values({ weekday, supplicationId })
      .onConflictDoUpdate({
        target: dailyContent.weekday,
        set: { supplicationId },
      });
  },
  clear: async (weekday) => {
    await db.delete(dailyContent).where(eq(dailyContent.weekday, weekday));
  },
});
