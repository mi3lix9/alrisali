import { Temporal } from "temporal-polyfill";

import { isHabitDueOn } from "./habit-schedule";
import type { HabitSchedule } from "./habit-schedule";
import { SALAH } from "./salah";
import type { Salah } from "./salah";

// Shared because the Prayer Log and Habits show their streaks, and Insights
// shows them all.

/**
 * The Prayer Streak ending on `date`: the run of consecutive days, up to and
 * including it, on which all five Salah were logged. It is 0 unless `date`
 * itself is complete. Always derived from the logs, so edits to past days
 * count straight away.
 */
export const prayerStreak = (
  logs: Iterable<{
    date: Temporal.PlainDate;
    performed: readonly Salah[];
  }>,
  date: Temporal.PlainDate
): number => {
  const completeDays = new Set<string>();
  for (const log of logs) {
    if (SALAH.every((salah) => log.performed.includes(salah))) {
      completeDays.add(log.date.toString());
    }
  }

  let streak = 0;
  let day = date;
  while (completeDays.has(day.toString())) {
    streak += 1;
    day = day.subtract({ days: 1 });
  }
  return streak;
};

/** A Habit's run of completed occurrences. */
export interface HabitStreak {
  /**
   * Consecutive due dates, back from today, that were completed. Today
   * counts once completed; until then it does not break the streak.
   */
  current: number;
  /** The longest such run up to today. */
  longest: number;
}

/**
 * The Habit's streaks, counted in due dates: a date the schedule skips
 * neither adds to nor breaks a streak, and completions on such dates or after
 * today are ignored.
 */
export const habitStreak = (
  schedule: HabitSchedule,
  completedDates: Iterable<Temporal.PlainDate>,
  today: Temporal.PlainDate
): HabitStreak => {
  const completed = new Set<string>();
  let earliest: Temporal.PlainDate | null = null;
  for (const date of completedDates) {
    if (
      Temporal.PlainDate.compare(date, today) <= 0 &&
      isHabitDueOn(schedule, date)
    ) {
      completed.add(date.toString());
      if (!earliest || Temporal.PlainDate.compare(date, earliest) < 0) {
        earliest = date;
      }
    }
  }
  if (!earliest) {
    return { current: 0, longest: 0 };
  }

  let longest = 0;
  let run = 0;
  for (
    let date = earliest;
    Temporal.PlainDate.compare(date, today) <= 0;
    date = date.add({ days: 1 })
  ) {
    if (isHabitDueOn(schedule, date)) {
      const done = completed.has(date.toString());
      // An open today keeps the run from the dates before it.
      if (done || !date.equals(today)) {
        run = done ? run + 1 : 0;
      }
      longest = Math.max(longest, run);
    }
  }
  return { current: run, longest };
};
