import { readHabitSchedule } from "@alrisali/domain/shared";
import type {
  HabitCompletionSource,
  InsightsHabit,
} from "@alrisali/domain/shared";
import { sql } from "drizzle-orm";
import { Temporal } from "temporal-polyfill";

import { localDateOf } from "../shared";
import type { InsightsSourceReader } from "../shared";

/** Habits as Insights read them, archived ones too, oldest first. */
export const readHabitsInsightsSource: InsightsSourceReader<
  InsightsHabit
> = async (db, timeZone) => {
  const rows = await db.values<
    [string, string | null, string | null, string, number | null, number]
  >(
    sql`SELECT id, name, preset, schedule, archived_at, created_at
        FROM habits ORDER BY created_at`
  );
  return rows.flatMap(([id, name, preset, stored, archivedAt, createdAt]) => {
    const schedule = readHabitSchedule(stored);
    return schedule
      ? [
          {
            id,
            name,
            preset,
            schedule,
            archived: archivedAt !== null,
            createdOn: localDateOf(createdAt, timeZone),
          },
        ]
      : [];
  });
};

/** Every Habit completion, by date. */
export const readHabitCompletionsInsightsSource: InsightsSourceReader<
  HabitCompletionSource
> = async (db) => {
  const rows = await db.values<[string, string]>(
    sql`SELECT habit_id, date FROM habit_completions ORDER BY date`
  );
  return rows.map(([habitId, day]) => ({
    habitId,
    date: Temporal.PlainDate.from(day),
  }));
};
