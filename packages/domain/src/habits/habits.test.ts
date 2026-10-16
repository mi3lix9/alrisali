import { Temporal } from "temporal-polyfill";
import { describe, expect, it } from "vitest";

import {
  habitScheduleSchema,
  habitStreak,
  isHabitDueOn,
  readHabitSchedule,
} from "../shared";
import type { HabitSchedule } from "../shared";
import { DEFAULT_HABITS } from "./habits";

// 2026-10-15 is a Thursday (ISO weekday 4).
const THURSDAY = Temporal.PlainDate.from("2026-10-15");
const date = (iso: string) => Temporal.PlainDate.from(iso);

const daily: HabitSchedule = { kind: "daily" };
// Monday and Thursday.
const mondayThursday: HabitSchedule = { kind: "weekdays", weekdays: [1, 4] };

describe(isHabitDueOn, () => {
  it("makes a daily Habit due every day", () => {
    expect(isHabitDueOn(daily, THURSDAY)).toBeTruthy();
    expect(isHabitDueOn(daily, date("2026-10-17"))).toBeTruthy();
  });

  it("makes a weekdays Habit due only on its chosen weekdays", () => {
    expect(isHabitDueOn(mondayThursday, THURSDAY)).toBeTruthy();
    expect(isHabitDueOn(mondayThursday, date("2026-10-19"))).toBeTruthy();
    expect(isHabitDueOn(mondayThursday, date("2026-10-16"))).toBeFalsy();
    expect(
      isHabitDueOn({ kind: "weekdays", weekdays: [7] }, date("2026-10-18"))
    ).toBeTruthy();
  });

  it("makes a once Habit due on its date alone", () => {
    const once: HabitSchedule = { kind: "once", date: THURSDAY };
    expect(isHabitDueOn(once, THURSDAY)).toBeTruthy();
    expect(isHabitDueOn(once, date("2026-10-14"))).toBeFalsy();
    expect(isHabitDueOn(once, date("2027-10-15"))).toBeFalsy();
  });
});

describe("stored schedules", () => {
  it("reads each kind, sorting and de-duplicating weekdays", () => {
    expect(habitScheduleSchema.parse({ kind: "daily" })).toStrictEqual(daily);
    expect(
      habitScheduleSchema.parse({ kind: "weekdays", weekdays: [4, 1, 4] })
    ).toStrictEqual(mondayThursday);
    expect(
      habitScheduleSchema.parse({ kind: "once", date: "2026-10-15" })
    ).toStrictEqual({ kind: "once", date: THURSDAY });
  });

  it("refuses no weekdays, weekday 0 and impossible dates", () => {
    for (const schedule of [
      { kind: "weekdays", weekdays: [] },
      { kind: "weekdays", weekdays: [0] },
      { kind: "once", date: "2026-02-30" },
      { kind: "monthly" },
    ]) {
      expect(habitScheduleSchema.safeParse(schedule).success).toBeFalsy();
    }
  });
});

describe(readHabitSchedule, () => {
  it("returns null for stored text it does not understand", () => {
    expect(readHabitSchedule('{"kind":"daily"}')).toStrictEqual(daily);
    expect(readHabitSchedule('{"kind":"monthly"}')).toBeNull();
    expect(readHabitSchedule("not json")).toBeNull();
  });
});

describe(habitStreak, () => {
  it("is zero with no completions", () => {
    expect(habitStreak(daily, [], THURSDAY)).toStrictEqual({
      current: 0,
      longest: 0,
    });
  });

  it("counts consecutive completed days up to today", () => {
    const done = ["2026-10-13", "2026-10-14", "2026-10-15"].map(date);
    expect(habitStreak(daily, done, THURSDAY)).toStrictEqual({
      current: 3,
      longest: 3,
    });
  });

  it("does not break the streak while today is still open", () => {
    const done = ["2026-10-13", "2026-10-14"].map(date);
    expect(habitStreak(daily, done, THURSDAY)).toStrictEqual({
      current: 2,
      longest: 2,
    });
  });

  it("is broken by a missed day, keeping the longest run", () => {
    const done = [
      "2026-10-08",
      "2026-10-09",
      "2026-10-10",
      "2026-10-12",
      "2026-10-14",
      "2026-10-15",
    ].map(date);
    expect(habitStreak(daily, done, THURSDAY)).toStrictEqual({
      current: 2,
      longest: 3,
    });
  });

  it("is zero once yesterday was missed and today is open", () => {
    const done = ["2026-10-12", "2026-10-13"].map(date);
    expect(habitStreak(daily, done, THURSDAY)).toStrictEqual({
      current: 0,
      longest: 2,
    });
  });

  it("counts only due weekdays: skipped days neither add nor break", () => {
    // Mondays and Thursdays from Thu 2026-10-01 to Thu 2026-10-15.
    const done = [
      "2026-10-01",
      "2026-10-05",
      "2026-10-08",
      "2026-10-12",
      "2026-10-15",
    ].map(date);
    expect(habitStreak(mondayThursday, done, THURSDAY)).toStrictEqual({
      current: 5,
      longest: 5,
    });
  });

  it("ignores completions on dates the schedule skips or after today", () => {
    const done = ["2026-10-13", "2026-10-14", "2026-10-16"].map(date);
    expect(habitStreak(mondayThursday, done, THURSDAY)).toStrictEqual({
      current: 0,
      longest: 0,
    });
  });

  it("is one for a once Habit completed on its date", () => {
    const once: HabitSchedule = { kind: "once", date: date("2026-10-10") };
    expect(habitStreak(once, [date("2026-10-10")], THURSDAY)).toStrictEqual({
      current: 1,
      longest: 1,
    });
    expect(habitStreak(once, [date("2026-10-11")], THURSDAY)).toStrictEqual({
      current: 0,
      longest: 0,
    });
  });
});

describe("default Habits", () => {
  it("are the four starters, with fixed ids so two devices seed the same rows", () => {
    expect(DEFAULT_HABITS.map(({ id }) => id)).toStrictEqual([
      "default:quran-page",
      "default:morning-adhkar",
      "default:evening-adhkar",
      "default:drink-water",
    ]);
  });
});
