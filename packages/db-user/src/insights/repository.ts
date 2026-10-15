import type {
  DhikrSessionSource,
  InsightsHabit,
  InsightsSources,
  KhushuRating,
  LoggedDay,
  TasbihLabel,
} from "@alrisali/domain/insights";
import { readHabitSchedule, SALAH, salahSchema } from "@alrisali/domain/shared";
import { sql } from "drizzle-orm";
import { Temporal } from "temporal-polyfill";

import type { UserDb } from "../shared";

/*
 * Insights own no table: they read what the Prayer Log, Khushu, Habits,
 * Tasbih and Mood features store, by their stored names. Those tables only
 * ever gain columns (ADR-0001), so these reads stay valid; the tests write
 * rows as those features do. Rows a newer app wrote that this one cannot
 * read are skipped, as each feature's own repository does.
 */

export interface InsightsRepository {
  /**
   * Everything Insights are computed from. Moments (check-ins, Dhikr
   * Sessions, Habit creation) become dates in `timeZone`, the Believer's.
   */
  sources: (timeZone: string) => Promise<InsightsSources>;
}

/** Tasbih al-Zahra's fixed id, the same on every device. */
const TASBIH_AL_ZAHRA_ID = "tasbih-al-zahra";

// Khushu levels run from 0 (distracted) to 10 (full Khushu).
const MAX_KHUSHU_LEVEL = 10;

const localDate = (epochMs: number, timeZone: string): Temporal.PlainDate =>
  Temporal.Instant.fromEpochMilliseconds(epochMs)
    .toZonedDateTimeISO(timeZone)
    .toPlainDate();

const readDistractions = (stored: string): string[] => {
  try {
    const parsed: unknown = JSON.parse(stored);
    return Array.isArray(parsed)
      ? parsed.filter((name): name is string => typeof name === "string")
      : [];
  } catch {
    return [];
  }
};

const readPrayerLogs = async (db: UserDb): Promise<LoggedDay[]> => {
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

const readKhushu = async (db: UserDb): Promise<KhushuRating[]> => {
  const rows = await db.values<[string, string, number, string, string | null]>(
    sql`SELECT date, salah, level, distractions, custom_distraction
        FROM khushu ORDER BY date`
  );
  return rows
    .flatMap(([day, storedSalah, level, distractions, customDistraction]) => {
      const salah = salahSchema.safeParse(storedSalah);
      if (
        !salah.success ||
        !Number.isInteger(level) ||
        level < 0 ||
        level > MAX_KHUSHU_LEVEL
      ) {
        return [];
      }
      return [
        {
          date: Temporal.PlainDate.from(day),
          salah: salah.data,
          level,
          distractions: readDistractions(distractions),
          customDistraction,
        },
      ];
    })
    .toSorted(
      (first, second) =>
        Temporal.PlainDate.compare(first.date, second.date) ||
        SALAH.indexOf(first.salah) - SALAH.indexOf(second.salah)
    );
};

const readHabits = async (
  db: UserDb,
  timeZone: string
): Promise<InsightsHabit[]> => {
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
            createdOn: localDate(createdAt, timeZone),
          },
        ]
      : [];
  });
};

const readDhikrSessions = async (
  db: UserDb,
  timeZone: string
): Promise<DhikrSessionSource[]> => {
  const rows = await db.values<
    [string, number, number, string | null, string | null]
  >(
    sql`SELECT dhikr_sessions.tasbih_id, dhikr_sessions.count,
               dhikr_sessions.completed_at, tasbih.kind, tasbih.name
        FROM dhikr_sessions
        LEFT JOIN tasbih ON tasbih.id = dhikr_sessions.tasbih_id
        ORDER BY dhikr_sessions.completed_at, dhikr_sessions.id`
  );
  return rows.flatMap(([tasbihId, count, completedAt, kind, name]) => {
    if (!Number.isInteger(count) || count <= 0) {
      return [];
    }
    let tasbih: TasbihLabel = { kind: "removed" };
    if (tasbihId === TASBIH_AL_ZAHRA_ID) {
      tasbih = { kind: "tasbih-al-zahra" };
    } else if (kind === "open" && name !== null) {
      tasbih = { kind: "open", name };
    }
    return [
      { tasbihId, tasbih, count, date: localDate(completedAt, timeZone) },
    ];
  });
};

const readMoodCheckIns = async (db: UserDb, timeZone: string) => {
  const rows = await db.values<[string, number]>(
    sql`SELECT mood, checked_in_at FROM mood_check_ins ORDER BY checked_in_at`
  );
  return rows.map(([mood, checkedInAt]) => ({
    mood,
    date: localDate(checkedInAt, timeZone),
  }));
};

export const createInsightsRepository = (db: UserDb): InsightsRepository => ({
  sources: async (timeZone) => {
    const [
      prayerLogs,
      khushu,
      habits,
      habitCompletions,
      dhikrSessions,
      moodCheckIns,
    ] = await Promise.all([
      readPrayerLogs(db),
      readKhushu(db),
      readHabits(db, timeZone),
      db.values<[string, string]>(
        sql`SELECT habit_id, date FROM habit_completions ORDER BY date`
      ),
      readDhikrSessions(db, timeZone),
      readMoodCheckIns(db, timeZone),
    ]);
    return {
      prayerLogs,
      khushu,
      habits,
      habitCompletions: habitCompletions.map(([habitId, day]) => ({
        habitId,
        date: Temporal.PlainDate.from(day),
      })),
      dhikrSessions,
      moodCheckIns,
    };
  },
});
