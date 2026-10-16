import { Temporal } from "temporal-polyfill";
import { describe, expect, it } from "vitest";

import type { HabitReminderPlan } from "../shared";
import { habitReminderSource } from "./habit-reminders";
import { planReminders } from "./planner";
import { DEFAULT_REMINDER_SETTINGS } from "./settings";

// Thursday 15 October 2026, noon in Baghdad.
const NOON = Temporal.ZonedDateTime.from("2026-10-15T12:00[Asia/Baghdad]");

const water: HabitReminderPlan = {
  habitId: "water",
  name: "Drink water",
  schedule: { kind: "daily" },
  reminderAt: 9 * 60 + 30,
};

const planHabits = (
  habits: readonly HabitReminderPlan[],
  overrides: { now?: Temporal.ZonedDateTime; quiet?: boolean } = {}
) =>
  planReminders({
    now: overrides.now ?? NOON,
    prayerTimes: null,
    settings: overrides.quiet
      ? {
          ...DEFAULT_REMINDER_SETTINGS,
          quietHours: { enabled: true, start: 22 * 60, end: 6 * 60 },
        }
      : DEFAULT_REMINDER_SETTINGS,
    messageStyle: "modern",
    sources: [habitReminderSource(habits, "modern")],
    days: 7,
  });

const local = (reminders: readonly { fireAt: Temporal.Instant }[]) =>
  reminders.map(({ fireAt }) =>
    fireAt
      .toZonedDateTimeISO("Asia/Baghdad")
      .toPlainDateTime()
      .toString({ smallestUnit: "minute" })
  );

describe(habitReminderSource, () => {
  it("plans a daily Habit at its time each day, from the next one", () => {
    const planned = planHabits([water]);
    expect(local(planned)).toStrictEqual([
      "2026-10-16T09:30",
      "2026-10-17T09:30",
      "2026-10-18T09:30",
      "2026-10-19T09:30",
      "2026-10-20T09:30",
      "2026-10-21T09:30",
    ]);
    expect(planned[0]).toMatchObject({
      id: "habit:water:2026-10-16",
      essential: false,
      message: {
        kind: "habit",
        habitId: "water",
        name: "Drink water",
        style: "modern",
      },
    });
  });

  it("plans a weekdays Habit only on its weekdays", () => {
    const planned = planHabits([
      { ...water, schedule: { kind: "weekdays", weekdays: [1, 5] } },
    ]);
    // Friday the 16th and Monday the 19th.
    expect(local(planned)).toStrictEqual([
      "2026-10-16T09:30",
      "2026-10-19T09:30",
    ]);
  });

  it("plans a once Habit on its date alone, and nothing once it has passed", () => {
    const once = {
      ...water,
      schedule: { kind: "once", date: Temporal.PlainDate.from("2026-10-15") },
      reminderAt: 18 * 60,
    } as const;
    expect(local(planHabits([once]))).toStrictEqual(["2026-10-15T18:00"]);
    expect(planHabits([once], { now: NOON.with({ hour: 19 }) })).toStrictEqual(
      []
    );
  });

  it("is held back by quiet hours", () => {
    const late = { ...water, reminderAt: 23 * 60 };
    expect(planHabits([late], { quiet: true })).toStrictEqual([]);
    expect(local(planHabits([late]))).toHaveLength(7);
  });
});
