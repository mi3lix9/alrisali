import { AYAT } from "@alrisali/content/quran";
import { Temporal } from "temporal-polyfill";
import { describe, expect, it } from "vitest";

import { createHijriCalendar } from "../shared";
import {
  khatmahPlanSchema,
  khatmahReminderPlan,
  khatmahStatus,
  planDays,
  readKhatmahPlan,
  serialiseKhatmahPlan,
  sessionDueDate,
  sessionsFor,
} from "./khatmah";
import type { Khatmah, KhatmahLog, KhatmahPlan } from "./khatmah";
import { AMOUNT_LIMITS, AMOUNT_UNITS } from "./plans";
import { nextHijriOccurrence, planForDeadline, previewPlan } from "./schedule";

const START = Temporal.PlainDate.from("2026-10-01");
const day = (offset: number) => START.add({ days: offset });

const khatmahOf = (plan: KhatmahPlan): Khatmah => ({
  id: "k",
  plan,
  startDate: START,
  reminderAt: 300,
  createdAt: 0,
});

const INDEX = new Map<string, number>(
  AYAT.map((ayah, position) => [ayah.key, position])
);
const index = (key: string) => INDEX.get(key) ?? -1;

/** The sessions that break contiguity, numbering or coverage; none when sound. */
const completenessProblems = (plan: KhatmahPlan, firstAyah = "1:1") => {
  const sessions = sessionsFor(plan);
  const problems = sessions.flatMap((session, position) => {
    const previous = sessions[position - 1];
    const expectedFrom = previous ? index(previous.to) + 1 : index(firstAyah);
    return session.number === position + 1 &&
      index(session.from) === expectedFrom &&
      index(session.to) >= expectedFrom
      ? []
      : [session];
  });
  const covers =
    sessions[0]?.from === firstAyah && sessions.at(-1)?.to === "114:6";
  return covers ? problems : [...problems, "does not span the Quran"];
};

describe("by-meaning plans", () => {
  it.each([7, 29, 60] as const)("%i days cover the Quran in order", (days) => {
    const plan: KhatmahPlan = { kind: "meaning", days };
    expect(planDays(plan)).toBe(days);
    expect(completenessProblems(plan)).toStrictEqual([]);
  });
});

describe("by-amount plans", () => {
  it.each([
    ["juz", 1, 30],
    ["juz", 3, 10],
    ["surahs", 1, 114],
    ["hizb", 2, 30],
    ["quarters", 1, 240],
    ["pages", 1, 604],
    ["pages", 20, 31],
  ] as const)(
    "splits by %s, %i a session, into %i sessions",
    (unit, count, total) => {
      expect(planDays({ kind: "amount", unit, count })).toBe(total);
    }
  );

  it("starts a juz session at the juz and a surah session at the surah", () => {
    const juz = sessionsFor({ kind: "amount", unit: "juz", count: 1 });
    expect(juz[1]?.from).toBe("2:142");
    expect(juz[0]?.to).toBe("2:141");
    const surahs = sessionsFor({ kind: "amount", unit: "surahs", count: 1 });
    expect(surahs[1]?.from).toBe("2:1");
    expect(surahs[1]?.to).toBe("2:286");
  });

  it("splits ayat into runs of the chosen size, the last shorter", () => {
    const sessions = sessionsFor({ kind: "amount", unit: "ayat", count: 1000 });
    expect(sessions).toHaveLength(7);
    expect(index(sessions[0]?.to ?? "") - index(sessions[0]?.from ?? "")).toBe(
      999
    );
  });

  it.each(
    AMOUNT_UNITS.flatMap((unit) =>
      [...new Set([AMOUNT_LIMITS[unit].min, 7, AMOUNT_LIMITS[unit].max])]
        .filter(
          (count) =>
            count >= AMOUNT_LIMITS[unit].min && count <= AMOUNT_LIMITS[unit].max
        )
        .map((count) => [unit, count] as const)
    )
  )("covers the Quran exactly once at %s x %i", (unit, count) => {
    expect(completenessProblems({ kind: "amount", unit, count })).toStrictEqual(
      []
    );
  });

  it.each([
    ["juz", 31],
    ["ayat", 4],
  ] as const)("rejects %s x %i, outside the unit's limits", (unit, count) => {
    expect(
      khatmahPlanSchema.safeParse({ kind: "amount", unit, count }).success
    ).toBeFalsy();
  });
});

const every = (days: 1 | 2 | 7) =>
  khatmahOf({ kind: "even", days: 10, every: days });

describe("session schedules", () => {
  it.each([
    [1, 2],
    [2, 4],
    [7, 14],
  ] as const)("spaces due dates %i days apart", (interval, offset) => {
    expect(sessionDueDate(every(interval), 3).toString()).toBe(
      day(offset).toString()
    );
  });

  it("counts only sessions that have fallen due when judging behind", () => {
    const weekly = every(7);
    const done: KhatmahLog[] = [{ khatmahId: "k", session: 1, date: day(0) }];
    expect(khatmahStatus(weekly, [], day(0)).state).toBe("on-track");
    expect(khatmahStatus(weekly, [], day(7))).toMatchObject({
      state: "behind",
      sessions: 1,
    });
    expect(khatmahStatus(weekly, [], day(8)).sessions).toBe(2);
    expect(khatmahStatus(weekly, done, day(6)).state).toBe("on-track");
    expect(khatmahStatus(weekly, [], day(0)).plannedFinish.toString()).toBe(
      day(63).toString()
    );
  });

  it("is ahead when more sessions are done than due", () => {
    const logs: KhatmahLog[] = [1, 2].map((session) => ({
      khatmahId: "k",
      session,
      date: day(0),
    }));
    const status = khatmahStatus(every(7), logs, day(0));
    expect(status.state).toBe("ahead");
    expect(status.sessions).toBe(1);
  });

  it("estimates the finish one interval apart from the next reading day", () => {
    const status = khatmahStatus(every(2), [], day(0));
    expect(status.estimatedFinish?.toString()).toBe(day(18).toString());
  });

  it("plans reminders one interval apart", () => {
    const plan = khatmahReminderPlan(every(7), [], day(0));
    expect(plan?.everyDays).toBe(7);
    expect(plan?.firstDate.toString()).toBe(day(0).toString());
  });

  it("round-trips a schedule through the stored text", () => {
    const plan: KhatmahPlan = { kind: "meaning", days: 29, every: 2, from: 4 };
    expect(readKhatmahPlan(serialiseKhatmahPlan(plan))).toStrictEqual(plan);
    expect(readKhatmahPlan('{"kind":"even","days":30}')).toStrictEqual({
      kind: "even",
      days: 30,
    });
  });
});

describe("joining at a session", () => {
  const joined: KhatmahPlan = { kind: "meaning", days: 7, from: 3 };

  it("starts at that session, renumbered from 1, and still ends at the end", () => {
    const sessions = sessionsFor(joined);
    expect(sessions).toHaveLength(5);
    expect(sessions[0]?.from).toBe("10:1");
    expect(sessions[0]?.number).toBe(1);
    expect(completenessProblems(joined, "10:1")).toStrictEqual([]);
  });

  it("computes the finish from the day it was joined", () => {
    const today = Temporal.PlainDate.from("2026-12-20");
    const preview = previewPlan(joined, today);
    expect(preview.sessions).toBe(5);
    expect(preview.finish.toString()).toBe("2026-12-24");
    const status = khatmahStatus(
      { ...khatmahOf(joined), startDate: today },
      [],
      today
    );
    expect(status.plannedFinish.toString()).toBe("2026-12-24");
    expect(status.current?.from).toBe("10:1");
  });

  it("keeps the last session when the join is past the end", () => {
    expect(planDays({ kind: "meaning", days: 7, from: 99 })).toBe(1);
  });
});

describe(previewPlan, () => {
  it("shows the daily amount, minutes per session and finish date", () => {
    const preview = previewPlan({ kind: "suggested" }, START);
    expect(preview.sessions).toBe(30);
    expect(preview.pagesPerSession).toBeCloseTo(604 / 30);
    expect(preview.minutesPerSession).toBe(40);
    expect(preview.finish.toString()).toBe(day(29).toString());
  });

  it("stretches the finish with the interval", () => {
    const preview = previewPlan({ kind: "even", days: 10, every: 7 }, START);
    expect(preview.finish.toString()).toBe(day(63).toString());
    expect(preview.everyDays).toBe(7);
  });
});

describe("deadline plans", () => {
  const calendar = createHijriCalendar();
  const today = Temporal.PlainDate.from("2027-01-15");
  const deadline = nextHijriOccurrence(calendar, today, { month: 9, day: 29 });
  const result = planForDeadline({ start: today, deadline });
  const plan: KhatmahPlan =
    result.ok === true ? result.plan : { kind: "suggested" };

  it("finds 29 Ramadan on or after today", () => {
    expect(calendar.toHijri(deadline)).toMatchObject({ month: 9, day: 29 });
    expect(deadline.until(today).sign).toBeLessThanOrEqual(0);
  });

  it("ends the sessions on a Hijri deadline such as 29 Ramadan", () => {
    const khatmah = { ...khatmahOf(plan), startDate: today };
    expect(result).toMatchObject({ ok: true });
    expect(sessionDueDate(khatmah, planDays(plan)).toString()).toBe(
      deadline.toString()
    );
    expect(completenessProblems(plan)).toStrictEqual([]);
  });

  it("ends no later than the deadline, within one interval of it", () => {
    const far = START.add({ days: 100 });
    const weekly = planForDeadline({ start: START, deadline: far, every: 7 });
    const finish = weekly.ok === true ? weekly.finish : far.add({ days: 99 });
    expect(finish.until(far).sign).toBeGreaterThanOrEqual(0);
    expect(finish.until(far).days).toBeLessThan(7);
  });

  it("falls on the same Hijri day next year when this year's has passed", () => {
    const late = Temporal.PlainDate.from("2027-12-01");
    const next = nextHijriOccurrence(calendar, late, { month: 9, day: 29 });
    expect(next.until(late).sign).toBeLessThanOrEqual(0);
    expect(calendar.toHijri(next)).toMatchObject({ month: 9, day: 29 });
  });

  it.each([
    [-1, "past"],
    [1, "tooShort"],
    [240, "tooLong"],
  ] as const)("refuses a deadline %i days out: %s", (offset, reason) => {
    expect(
      planForDeadline({ start: START, deadline: day(offset) })
    ).toStrictEqual({ ok: false, reason });
  });
});
