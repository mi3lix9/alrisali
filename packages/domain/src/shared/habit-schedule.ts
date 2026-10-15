import { Temporal } from "temporal-polyfill";
import { z } from "zod";

import type { Weekday } from "./hijri";

/**
 * When a Habit is due: every day, on chosen weekdays (ISO numbering, 1 is
 * Monday and 7 is Sunday), or once on one date. Shared because Habits and
 * their Reminders both read it.
 */
export type HabitSchedule =
  | { kind: "daily" }
  | { kind: "weekdays"; weekdays: readonly Weekday[] }
  | { kind: "once"; date: Temporal.PlainDate };

const weekdaySchema = z.union([
  z.literal(1),
  z.literal(2),
  z.literal(3),
  z.literal(4),
  z.literal(5),
  z.literal(6),
  z.literal(7),
]);

/** Each weekday once, Monday first. */
const normaliseWeekdays = (weekdays: readonly Weekday[]): Weekday[] =>
  [...new Set(weekdays)].toSorted((a, b) => a - b);

const isoDateSchema = z.iso.date().transform((date, context) => {
  try {
    return Temporal.PlainDate.from(date, { overflow: "reject" });
  } catch {
    context.addIssue({ code: "custom", message: "Not a calendar date" });
    return z.NEVER;
  }
});

/**
 * A schedule as it is stored (`once` carries its ISO date as text). At least
 * one weekday is required.
 */
export const habitScheduleSchema = z
  .discriminatedUnion("kind", [
    z.object({ kind: z.literal("daily") }),
    z.object({
      kind: z.literal("weekdays"),
      weekdays: z.array(weekdaySchema).min(1),
    }),
    z.object({ kind: z.literal("once"), date: isoDateSchema }),
  ])
  .transform((schedule): HabitSchedule => {
    if (schedule.kind === "weekdays") {
      return {
        kind: "weekdays",
        weekdays: normaliseWeekdays(schedule.weekdays),
      };
    }
    return schedule;
  });

/** The schedule as JSON-ready data, the inverse of `habitScheduleSchema`. */
export const serialiseHabitSchedule = (
  schedule: HabitSchedule
):
  | { kind: "daily" }
  | { kind: "weekdays"; weekdays: Weekday[] }
  | { kind: "once"; date: string } => {
  switch (schedule.kind) {
    case "weekdays": {
      return {
        kind: "weekdays",
        weekdays: normaliseWeekdays(schedule.weekdays),
      };
    }
    case "once": {
      return { kind: "once", date: schedule.date.toString() };
    }
    default: {
      return { kind: "daily" };
    }
  }
};

/** Whether a Habit with this schedule is due on `date`. */
export const isHabitDueOn = (
  schedule: HabitSchedule,
  date: Temporal.PlainDate
): boolean => {
  switch (schedule.kind) {
    case "weekdays": {
      return schedule.weekdays.includes(date.dayOfWeek as Weekday);
    }
    case "once": {
      return Temporal.PlainDate.compare(schedule.date, date) === 0;
    }
    default: {
      return true;
    }
  }
};

/** A Habit as its Reminder sees it. */
export interface HabitReminderPlan {
  habitId: string;
  /** The Habit's name, in the language the Reminder is worded in. */
  name: string;
  schedule: HabitSchedule;
  /** Minutes after local midnight the Reminder fires. */
  reminderAt: number;
}
