import { AYAT } from "@alrisali/content/quran";
import { Temporal } from "temporal-polyfill";
import { describe, expect, it } from "vitest";

import {
  completePortionAt,
  isPortionEnd,
  khatmahLogId,
  khatmahReminderPlan,
  khatmahSessionRows,
  khatmahStatus,
  MAX_EVEN_DAYS,
  MIN_EVEN_DAYS,
  planDays,
  readKhatmahPlan,
  serialiseKhatmahPlan,
  sessionsFor,
  SUGGESTED_DAYS,
} from "./khatmah";
import type { Khatmah, KhatmahLog, KhatmahPlan } from "./khatmah";

const START = Temporal.PlainDate.from("2026-10-01");

const thirtyDays: Khatmah = {
  id: "k1",
  plan: { kind: "suggested" },
  startDate: START,
  reminderAt: 5 * 60,
  createdAt: 0,
};

const day = (offset: number): Temporal.PlainDate => START.add({ days: offset });

const logs = (sessions: number[], on: Temporal.PlainDate): KhatmahLog[] =>
  sessions.map((session) => ({ khatmahId: "k1", session, date: on }));

const upTo = (count: number): number[] =>
  Array.from({ length: count }, (_, index) => index + 1);

const AYAH_INDEX = new Map<string, number>(
  AYAT.map((ayah, position) => [ayah.key, position])
);

const ayahIndexOf = (key: string): number => AYAH_INDEX.get(key) ?? -1;

describe(sessionsFor, () => {
  it("covers all 6236 ayat exactly once, in order, for every even split from 3 to 240 days", () => {
    const broken = Array.from(
      { length: MAX_EVEN_DAYS - MIN_EVEN_DAYS + 1 },
      (_, offset) => MIN_EVEN_DAYS + offset
    ).filter((days) => {
      const sessions = sessionsFor({ kind: "even", days });
      let next = 0;
      const contiguous = sessions.every((session) => {
        const last = ayahIndexOf(session.to);
        const fits = ayahIndexOf(session.from) === next && last >= next;
        next = last + 1;
        return fits;
      });
      return !(contiguous && sessions.length === days && next === AYAT.length);
    });
    expect(broken).toStrictEqual([]);
  });

  it("makes the suggested plan thirty sessions of one juz each", () => {
    const sessions = sessionsFor({ kind: "suggested" });
    expect(sessions).toHaveLength(SUGGESTED_DAYS);
    expect(sessions[0]).toMatchObject({ from: "1:1", to: "2:141" });
    expect(sessions[1]?.from).toBe("2:142");
    expect(sessions.at(-1)?.to).toBe("114:6");
  });

  it("makes a 240-day split one hizb quarter a day", () => {
    const sessions = sessionsFor({ kind: "even", days: 240 });
    expect(sessions[0]).toMatchObject({ from: "1:1", to: "2:25" });
    expect(sessions[1]).toMatchObject({ from: "2:26", to: "2:43" });
  });

  it("counts the pages a portion touches", () => {
    const [first] = sessionsFor({ kind: "suggested" });
    expect(first).toMatchObject({ firstPage: 1, lastPage: 21, pages: 21 });
  });
});

describe(isPortionEnd, () => {
  const plan: KhatmahPlan = { kind: "suggested" };

  it("is true on the last ayah of a session", () => {
    expect(isPortionEnd(plan, "2:141")).toBeTruthy();
    expect(isPortionEnd(plan, "114:6")).toBeTruthy();
  });

  it("is false on any other ayah", () => {
    expect(isPortionEnd(plan, "2:142")).toBeFalsy();
    expect(isPortionEnd(plan, "1:1")).toBeFalsy();
  });
});

describe("plan storage", () => {
  it("round-trips a plan through text", () => {
    const plan: KhatmahPlan = { kind: "even", days: 45 };
    expect(readKhatmahPlan(serialiseKhatmahPlan(plan))).toStrictEqual(plan);
    expect(planDays(plan)).toBe(45);
  });

  it("refuses plans outside 3 to 240 days and unknown kinds", () => {
    expect(() => serialiseKhatmahPlan({ kind: "even", days: 2 })).toThrow(/./u);
    expect(() => serialiseKhatmahPlan({ kind: "even", days: 241 })).toThrow(
      /./u
    );
    expect(readKhatmahPlan('{"kind":"by-meaning","days":7}')).toBeNull();
    expect(readKhatmahPlan("not json")).toBeNull();
  });
});

describe(khatmahStatus, () => {
  it("is on track on the first day before reading anything", () => {
    const status = khatmahStatus(thirtyDays, [], day(0));
    expect(status).toMatchObject({
      state: "on-track",
      sessions: 0,
      done: 0,
      completedToday: false,
    });
    expect(status.current?.number).toBe(1);
    expect(status.estimatedFinish?.toString()).toBe(day(29).toString());
  });

  it("is on track when every session due before today is done", () => {
    const status = khatmahStatus(thirtyDays, logs(upTo(4), day(3)), day(4));
    expect(status.state).toBe("on-track");
    expect(status.current?.number).toBe(5);
  });

  it("is on track after reading today's own session", () => {
    const status = khatmahStatus(thirtyDays, logs(upTo(5), day(4)), day(4));
    expect(status.state).toBe("on-track");
    expect(status.completedToday).toBeTruthy();
    expect(status.estimatedFinish?.toString()).toBe(day(29).toString());
  });

  it("is behind by the sessions due before today that are not done", () => {
    const status = khatmahStatus(thirtyDays, logs(upTo(4), day(3)), day(6));
    expect(status).toMatchObject({ state: "behind", sessions: 2 });
    expect(status.estimatedFinish?.toString()).toBe(day(31).toString());
  });

  it("is ahead by the sessions done beyond today's", () => {
    const status = khatmahStatus(thirtyDays, logs(upTo(8), day(3)), day(3));
    expect(status).toMatchObject({ state: "ahead", sessions: 4 });
    expect(status.estimatedFinish?.toString()).toBe(day(25).toString());
  });

  it("is finished once every session is done", () => {
    const status = khatmahStatus(thirtyDays, logs(upTo(30), day(20)), day(21));
    expect(status).toMatchObject({
      state: "finished",
      current: null,
      estimatedFinish: null,
      done: 30,
      pagesRead: 604,
    });
  });

  it("counts a session logged twice once and ignores other Khatmahs", () => {
    const status = khatmahStatus(
      thirtyDays,
      [
        ...logs([1, 1], day(0)),
        { khatmahId: "other", session: 2, date: day(0) },
      ],
      day(0)
    );
    expect(status.done).toBe(1);
  });

  it("counts only pages wholly inside completed sessions as read", () => {
    const status = khatmahStatus(thirtyDays, logs([1], day(0)), day(0));
    // A page shared with the next session is not read until that one is.
    const [first] = sessionsFor(thirtyDays.plan);
    expect(status.pagesRead).toBeLessThanOrEqual(first?.pages ?? 0);
    expect(status.pagesRead).toBeGreaterThan(0);
  });
});

describe(khatmahSessionRows, () => {
  it("marks done, missed, today and upcoming sessions", () => {
    const rows = khatmahSessionRows(thirtyDays, logs([1], day(0)), day(2));
    expect(rows.slice(0, 5).map(({ state }) => state)).toStrictEqual([
      "done",
      "missed",
      "today",
      "upcoming",
      "upcoming",
    ]);
    expect(rows[1]?.daysFromToday).toBe(-1);
    expect(rows[3]?.daysFromToday).toBe(1);
    expect(rows[0]?.doneOn?.toString()).toBe(day(0).toString());
  });
});

describe(completePortionAt, () => {
  it("logs today's portion from the ayah it ends on", () => {
    const log = completePortionAt(thirtyDays, [], "2:141", day(0));
    expect(log).toStrictEqual({
      khatmahId: "k1",
      session: 1,
      date: day(0),
    });
  });

  it("logs the oldest unfinished portion when behind", () => {
    const log = completePortionAt(thirtyDays, [], "2:141", day(3));
    expect(log?.session).toBe(1);
    expect(completePortionAt(thirtyDays, [], "2:252", day(3))).toBeNull();
  });

  it("does nothing on an ayah that does not end the current portion", () => {
    expect(completePortionAt(thirtyDays, [], "1:7", day(0))).toBeNull();
    expect(
      completePortionAt(thirtyDays, logs(upTo(30), day(0)), "114:6", day(1))
    ).toBeNull();
  });
});

describe(khatmahLogId, () => {
  it("names the same completion the same on every device", () => {
    expect(khatmahLogId("k1", 3)).toBe("k1:3");
  });
});

describe(khatmahReminderPlan, () => {
  it("is null without a reminder time or when finished", () => {
    expect(
      khatmahReminderPlan({ ...thirtyDays, reminderAt: null }, [], day(0))
    ).toBeNull();
    expect(
      khatmahReminderPlan(thirtyDays, logs(upTo(30), day(0)), day(1))
    ).toBeNull();
  });

  it("starts tomorrow once today's portion is done", () => {
    const plan = khatmahReminderPlan(thirtyDays, logs([1], day(0)), day(0));
    expect(plan?.firstDate.toString()).toBe(day(1).toString());
    expect(plan?.portions[0]?.from).toBe("2:142");
  });
});
