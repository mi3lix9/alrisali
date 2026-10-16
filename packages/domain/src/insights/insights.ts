import { Temporal } from "temporal-polyfill";

import {
  displayedPrayerStreak,
  habitStreak,
  isHabitDueOn,
  SALAH,
} from "../shared";
import type {
  HabitStreak,
  InsightsSources,
  KhushuRating,
  LoggedDay,
  TasbihLabel,
} from "../shared";
import { khatmahInsights } from "./khatmah";
import type { KhatmahInsights } from "./khatmah";

/*
 * Insights are pure aggregations over what the Believer recorded on this
 * device, so they work offline and for Guests alike. Nothing here is stored:
 * every figure is derived again from the sources.
 */

/** The days the overview and weekly chart cover, ending today. */
export const INSIGHTS_WEEK_DAYS = 7;
/** The days the heatmap covers, ending today: twelve weeks. */
export const HEATMAP_DAYS = 84;
/** The days the mood distribution and Distractions cover, ending today. */
export const RECENT_DAYS = 30;

/** The highest heatmap level. */
export const MAX_HEATMAP_LEVEL = 4;

// How much each kind of worship fills a heatmap day, adding up to 1.
const HEATMAP_SALAH_WEIGHT = 0.6;
const HEATMAP_HABIT_WEIGHT = 0.25;
const HEATMAP_DHIKR_WEIGHT = 0.15;

/** The `count` dates ending on `last`, oldest first. */
const daysEndingOn = (
  last: Temporal.PlainDate,
  count: number
): Temporal.PlainDate[] =>
  Array.from({ length: count }, (_, index) =>
    last.subtract({ days: count - 1 - index })
  );

const isWithin = (
  date: Temporal.PlainDate,
  first: Temporal.PlainDate,
  last: Temporal.PlainDate
): boolean =>
  Temporal.PlainDate.compare(date, first) >= 0 &&
  Temporal.PlainDate.compare(date, last) <= 0;

const sum = (values: readonly number[]): number => {
  let total = 0;
  for (const value of values) {
    total += value;
  }
  return total;
};

const average = (values: readonly number[]): number | null =>
  values.length === 0 ? null : sum(values) / values.length;

/**
 * Khushu ratings whose Salah is still ticked in the Prayer Log. Un-ticking a
 * Salah keeps its rating, but a Salah not logged as performed is not counted.
 */
export const loggedKhushu = (
  khushu: readonly KhushuRating[],
  prayerLogs: readonly LoggedDay[]
): KhushuRating[] => {
  const performed = new Set(
    prayerLogs.flatMap((log) =>
      log.performed.map((salah) => `${log.date.toString()}:${salah}`)
    )
  );
  return khushu.filter((rating) =>
    performed.has(`${rating.date.toString()}:${rating.salah}`)
  );
};

/** One day as the Insights count it. */
interface DayTally {
  salah: number;
  /** Habits due that day (active, created by then) and ticked. */
  habitsDone: number;
  habitsDue: number;
  dhikrSessions: number;
  khushuLevels: number[];
}

/** Tallies each day in the sources, keyed by ISO date. */
const tallyDays = (sources: InsightsSources) => {
  const days = new Map<string, DayTally>();
  const day = (date: Temporal.PlainDate): DayTally => {
    const key = date.toString();
    const found = days.get(key);
    if (found) {
      return found;
    }
    const tally: DayTally = {
      salah: 0,
      habitsDone: 0,
      habitsDue: 0,
      dhikrSessions: 0,
      khushuLevels: [],
    };
    days.set(key, tally);
    return tally;
  };

  for (const log of sources.prayerLogs) {
    day(log.date).salah += new Set(log.performed).size;
  }
  for (const rating of loggedKhushu(sources.khushu, sources.prayerLogs)) {
    day(rating.date).khushuLevels.push(rating.level);
  }
  for (const session of sources.dhikrSessions) {
    day(session.date).dhikrSessions += 1;
  }

  const habits = new Map(
    sources.habits
      .filter((habit) => !habit.archived)
      .map((habit) => [habit.id, habit])
  );
  const counted = new Set<string>();
  for (const { habitId, date } of sources.habitCompletions) {
    const habit = habits.get(habitId);
    const key = `${habitId}:${date.toString()}`;
    if (
      habit &&
      !counted.has(key) &&
      Temporal.PlainDate.compare(habit.createdOn, date) <= 0 &&
      isHabitDueOn(habit.schedule, date)
    ) {
      counted.add(key);
      day(date).habitsDone += 1;
    }
  }

  /** The tally for `date`, with the Habits due on it counted. */
  return (date: Temporal.PlainDate): Readonly<DayTally> => {
    const tally = days.get(date.toString());
    let habitsDue = 0;
    for (const habit of habits.values()) {
      if (
        Temporal.PlainDate.compare(habit.createdOn, date) <= 0 &&
        isHabitDueOn(habit.schedule, date)
      ) {
        habitsDue += 1;
      }
    }
    return {
      salah: tally?.salah ?? 0,
      habitsDone: tally?.habitsDone ?? 0,
      habitsDue,
      dhikrSessions: tally?.dhikrSessions ?? 0,
      khushuLevels: tally?.khushuLevels ?? [],
    };
  };
};

export interface InsightsOverview {
  /**
   * The Prayer Streak shown today: including today once all five are
   * logged, until then the run that ended yesterday.
   */
  prayerStreak: number;
  /** Whether all five Salah are logged today. */
  todayComplete: boolean;
  /** Salah logged in the last 7 days, out of 35. */
  salahLogged: number;
  salahPossible: number;
  /** Average Khushu of the Salah logged in the last 7 days, or null. */
  averageKhushu: number | null;
  /**
   * Points up or down from the 7 days before that; null without ratings in
   * both weeks.
   */
  khushuChange: number | null;
  /** Due Habits ticked in the last 7 days (0–1); null when none were due. */
  habitCompletion: number | null;
}

export interface InsightsDay {
  date: Temporal.PlainDate;
  /** Salah logged, 0–5. */
  salah: number;
  /** Due Habits ticked. */
  habitsDone: number;
  habitsDue: number;
  dhikrSessions: number;
  /** Average Khushu of that day's logged Salah, or null. */
  averageKhushu: number | null;
}

export interface HeatmapDay extends InsightsDay {
  /**
   * 0 (nothing recorded) to `MAX_HEATMAP_LEVEL`. Salah fill 60% of a day,
   * due Habits 25% and any Dhikr Session 15%.
   */
  level: number;
}

export interface HabitStreakInsight extends HabitStreak {
  habitId: string;
  name: string | null;
  preset: string | null;
}

export interface TasbihTotal {
  tasbihId: string;
  tasbih: TasbihLabel;
  /** Every count recorded in its Dhikr Sessions. */
  total: number;
  sessions: number;
}

export interface MoodShare {
  mood: string;
  count: number;
  /** Of all check-ins in the period, 0–1. */
  share: number;
}

export interface MoodDistribution {
  checkIns: number;
  moods: MoodShare[];
}

export interface DistractionShare {
  /** The Distraction's key, or null for ones the Believer typed. */
  distraction: string | null;
  count: number;
  /** Of the rated Salah in the period, 0–1. */
  share: number;
}

export interface DistractionBreakdown {
  /** Logged Salah with a Khushu rating in the period. */
  ratedSalah: number;
  distractions: DistractionShare[];
}

export interface Insights {
  overview: InsightsOverview;
  /** The last 7 days, oldest first. */
  week: InsightsDay[];
  /** The last 84 days, oldest first. */
  heatmap: HeatmapDay[];
  habitStreaks: HabitStreakInsight[];
  tasbihTotals: TasbihTotal[];
  moods: MoodDistribution;
  distractions: DistractionBreakdown;
  khatmah: KhatmahInsights;
}

const toInsightsDay = (
  date: Temporal.PlainDate,
  tally: Readonly<DayTally>
): InsightsDay => ({
  date,
  salah: tally.salah,
  habitsDone: tally.habitsDone,
  habitsDue: tally.habitsDue,
  dhikrSessions: tally.dhikrSessions,
  averageKhushu: average(tally.khushuLevels),
});

const heatmapLevel = (day: InsightsDay): number => {
  const score =
    HEATMAP_SALAH_WEIGHT * (day.salah / SALAH.length) +
    HEATMAP_HABIT_WEIGHT *
      (day.habitsDue === 0 ? 0 : day.habitsDone / day.habitsDue) +
    HEATMAP_DHIKR_WEIGHT * (day.dhikrSessions > 0 ? 1 : 0);
  return Math.min(MAX_HEATMAP_LEVEL, Math.ceil(score * MAX_HEATMAP_LEVEL));
};

type DayLookup = (date: Temporal.PlainDate) => Readonly<DayTally>;

const overviewFrom = (
  sources: InsightsSources,
  tally: DayLookup,
  today: Temporal.PlainDate
): InsightsOverview => {
  const thisWeek = daysEndingOn(today, INSIGHTS_WEEK_DAYS).map(tally);
  const lastWeek = daysEndingOn(
    today.subtract({ days: INSIGHTS_WEEK_DAYS }),
    INSIGHTS_WEEK_DAYS
  ).map(tally);

  const averageKhushu = average(thisWeek.flatMap((day) => day.khushuLevels));
  const previousKhushu = average(lastWeek.flatMap((day) => day.khushuLevels));
  const habitsDue = sum(thisWeek.map((day) => day.habitsDue));
  const habitsDone = sum(thisWeek.map((day) => day.habitsDone));
  const streak = displayedPrayerStreak(sources.prayerLogs, today);

  return {
    prayerStreak: streak.days,
    todayComplete: streak.todayComplete,
    salahLogged: sum(thisWeek.map((day) => day.salah)),
    salahPossible: INSIGHTS_WEEK_DAYS * SALAH.length,
    averageKhushu,
    khushuChange:
      averageKhushu === null || previousKhushu === null
        ? null
        : averageKhushu - previousKhushu,
    habitCompletion: habitsDue === 0 ? null : habitsDone / habitsDue,
  };
};

/** Each active Habit's streaks, the longest current streak first. */
const habitStreaks = (
  sources: InsightsSources,
  today: Temporal.PlainDate
): HabitStreakInsight[] =>
  sources.habits
    .filter((habit) => !habit.archived)
    .map((habit) => ({
      habitId: habit.id,
      name: habit.name,
      preset: habit.preset,
      ...habitStreak(
        habit.schedule,
        sources.habitCompletions
          .filter((completion) => completion.habitId === habit.id)
          .map((completion) => completion.date),
        today
      ),
    }))
    .toSorted(
      (first, second) =>
        second.current - first.current || second.longest - first.longest
    );

/** Each Tasbih's recorded Dhikr, all time, the largest total first. */
const tasbihTotals = (sources: InsightsSources): TasbihTotal[] => {
  const totals = new Map<string, TasbihTotal>();
  for (const session of sources.dhikrSessions) {
    const total = totals.get(session.tasbihId) ?? {
      tasbihId: session.tasbihId,
      tasbih: session.tasbih,
      total: 0,
      sessions: 0,
    };
    total.total += session.count;
    total.sessions += 1;
    totals.set(session.tasbihId, total);
  }
  return [...totals.values()].toSorted(
    (first, second) => second.total - first.total
  );
};

/** Counts each key, most frequent first (ties keep first-seen order). */
const countBy = <Key>(keys: readonly Key[]): [Key, number][] => {
  const counts = new Map<Key, number>();
  for (const key of keys) {
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }
  return [...counts.entries()].toSorted(
    ([, first], [, second]) => second - first
  );
};

/** How the Believer felt in their check-ins over the last 30 days. */
const moodDistribution = (
  sources: InsightsSources,
  today: Temporal.PlainDate
): MoodDistribution => {
  const first = today.subtract({ days: RECENT_DAYS - 1 });
  const moods = sources.moodCheckIns
    .filter((checkIn) => isWithin(checkIn.date, first, today))
    .map((checkIn) => checkIn.mood);
  return {
    checkIns: moods.length,
    moods: countBy(moods).map(([mood, count]) => ({
      mood,
      count,
      share: count / moods.length,
    })),
  };
};

/**
 * What pulled the Believer's attention in the logged Salah they rated over
 * the last 30 days.
 */
const distractionBreakdown = (
  sources: InsightsSources,
  today: Temporal.PlainDate
): DistractionBreakdown => {
  const first = today.subtract({ days: RECENT_DAYS - 1 });
  const rated = loggedKhushu(sources.khushu, sources.prayerLogs).filter(
    (rating) => isWithin(rating.date, first, today)
  );
  const named = rated.flatMap((rating): (string | null)[] => [
    ...new Set(rating.distractions),
    ...(rating.customDistraction === null ? [] : [null]),
  ]);
  return {
    ratedSalah: rated.length,
    distractions: countBy(named).map(([distraction, count]) => ({
      distraction,
      count,
      share: count / rated.length,
    })),
  };
};

/** All the Insights for `today`. */
export const insights = (
  sources: InsightsSources,
  today: Temporal.PlainDate
): Insights => {
  const tally = tallyDays(sources);
  const heatmap = daysEndingOn(today, HEATMAP_DAYS).map((date) => {
    const day = toInsightsDay(date, tally(date));
    return { ...day, level: heatmapLevel(day) };
  });
  return {
    overview: overviewFrom(sources, tally, today),
    week: daysEndingOn(today, INSIGHTS_WEEK_DAYS).map((date) =>
      toInsightsDay(date, tally(date))
    ),
    heatmap,
    habitStreaks: habitStreaks(sources, today),
    tasbihTotals: tasbihTotals(sources),
    moods: moodDistribution(sources, today),
    distractions: distractionBreakdown(sources, today),
    khatmah: khatmahInsights(sources),
  };
};
