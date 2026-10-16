import { Temporal } from "temporal-polyfill";
import { describe, expect, it } from "vitest";

import {
  actsForDate,
  assertCanCompleteAct,
  FutureActDateError,
  isActDueOn,
  unseenPrograms,
} from "./acts";
import { actSchema, officialProgramSchema } from "./program";
import type { ActInput, OfficialProgramInput } from "./program";
import type { Subscription } from "./subscription";

const empty = { ar: "", en: "" };

const act = (id: string, overrides: Partial<ActInput> = {}): ActInput => ({
  id,
  name: { ar: id, en: id },
  description: empty,
  schedule: { kind: "daily" },
  salah: null,
  detail: { type: "regular" },
  ...overrides,
});

const program = (input: Partial<OfficialProgramInput> & { id: string }) =>
  officialProgramSchema.parse({
    category: "general",
    name: { ar: input.id, en: input.id },
    description: empty,
    active: true,
    acts: [],
    ...input,
  });

const subscription = (
  programId: string,
  overrides: Partial<Subscription> = {}
): Subscription => ({
  programId,
  programKind: "general",
  paused: false,
  subscribedAt: 1,
  ...overrides,
});

// 2026-10-15 is a Thursday (weekday 4).
const thursday = Temporal.PlainDate.from("2026-10-15");
const ramadanDay = { year: 1448, month: 9, day: 10 } as const;
const shawwalDay = { year: 1448, month: 10, day: 2 } as const;

const ids = (acts: { act: { id: string } }[]) => acts.map(({ act: a }) => a.id);

const schedule = (input: ActInput["schedule"]) =>
  actSchema.parse(act("a", { schedule: input })).schedule;

describe("Act visibility per frequency", () => {
  it("shows a daily Act on every date", () => {
    for (const days of [0, 1, 2, 3, 4, 5, 6]) {
      expect(
        isActDueOn(schedule({ kind: "daily" }), thursday.add({ days }))
      ).toBeTruthy();
    }
  });

  it("shows a weekday Act only on its weekdays (1 = Monday … 7 = Sunday)", () => {
    const fridaysAndMondays = schedule({ kind: "weekdays", weekdays: [5, 1] });

    expect(isActDueOn(fridaysAndMondays, thursday)).toBeFalsy();
    expect(
      isActDueOn(fridaysAndMondays, Temporal.PlainDate.from("2026-10-16"))
    ).toBeTruthy();
    expect(
      isActDueOn(fridaysAndMondays, Temporal.PlainDate.from("2026-10-19"))
    ).toBeTruthy();
    expect(
      isActDueOn(fridaysAndMondays, Temporal.PlainDate.from("2026-10-18"))
    ).toBeFalsy();
  });

  it("shows a one-date Act on that date only", () => {
    const once = schedule({ kind: "once", date: "2026-10-15" });

    expect(isActDueOn(once, thursday)).toBeTruthy();
    expect(isActDueOn(once, thursday.add({ days: 1 }))).toBeFalsy();
    expect(isActDueOn(once, thursday.subtract({ years: 1 }))).toBeFalsy();
  });
});

describe(actsForDate, () => {
  it("groups a date's Acts before and after each Salah, in prayer order, then general ones", () => {
    const nawafil = program({
      id: "nawafil",
      acts: [
        act("general-1"),
        act("after-isha", { salah: { salah: "isha", timing: "after" } }),
        act("before-fajr", { salah: { salah: "fajr", timing: "before" } }),
        act("after-fajr", { salah: { salah: "fajr", timing: "after" } }),
        act("before-isha", { salah: { salah: "isha", timing: "before" } }),
        act("general-2"),
      ],
    });

    const day = actsForDate({
      programs: [nawafil],
      subscriptions: [subscription("nawafil")],
      date: thursday,
      hijriDate: shawwalDay,
    });

    expect(
      day.bySalah.map(({ salah, before, after }) => ({
        salah,
        before: ids(before),
        after: ids(after),
      }))
    ).toStrictEqual([
      { salah: "fajr", before: ["before-fajr"], after: ["after-fajr"] },
      { salah: "isha", before: ["before-isha"], after: ["after-isha"] },
    ]);
    expect(ids(day.general)).toStrictEqual(["general-1", "general-2"]);
    expect(day.general[0]?.program.id).toBe("nawafil");
  });

  it("leaves out Acts not due on the date", () => {
    const weekly = program({
      id: "weekly",
      acts: [
        act("friday", { schedule: { kind: "weekdays", weekdays: [5] } }),
        act("thursday", { schedule: { kind: "weekdays", weekdays: [4] } }),
        act("yesterday", { schedule: { kind: "once", date: "2026-10-14" } }),
      ],
    });

    const day = actsForDate({
      programs: [weekly],
      subscriptions: [subscription("weekly")],
      date: thursday,
      hijriDate: shawwalDay,
    });

    expect(ids(day.general)).toStrictEqual(["thursday"]);
  });

  it("shows only active Subscriptions, oldest first, ignoring paused ones and Programs that are gone", () => {
    const first = program({ id: "first", acts: [act("first-act")] });
    const second = program({ id: "second", acts: [act("second-act")] });
    const paused = program({ id: "paused", acts: [act("paused-act")] });
    const off = program({ id: "off", active: false, acts: [act("off-act")] });
    const unsubscribed = program({ id: "other", acts: [act("other-act")] });

    const day = actsForDate({
      programs: [unsubscribed, second, paused, off, first],
      subscriptions: [
        subscription("first"),
        subscription("deleted"),
        subscription("paused", { paused: true }),
        subscription("off"),
        subscription("second"),
      ],
      date: thursday,
      hijriDate: shawwalDay,
    });

    expect(ids(day.general)).toStrictEqual(["first-act", "second-act"]);
  });

  it("shows a Seasonal Program's Acts only on dates within its Hijri window", () => {
    const ramadan = program({
      id: "ramadan",
      category: "seasonal",
      window: { start: { month: 9, day: 1 }, end: { month: 9, day: 30 } },
      acts: [act("iftar-dua")],
    });
    const input = {
      programs: [ramadan],
      subscriptions: [subscription("ramadan", { programKind: "seasonal" })],
      date: thursday,
    };

    expect(
      ids(actsForDate({ ...input, hijriDate: ramadanDay }).general)
    ).toStrictEqual(["iftar-dua"]);
    expect(
      actsForDate({ ...input, hijriDate: shawwalDay }).general
    ).toStrictEqual([]);
  });

  it("has nothing for a Believer without Subscriptions", () => {
    expect(
      actsForDate({
        programs: [program({ id: "nawafil", acts: [act("a")] })],
        subscriptions: [],
        date: thursday,
        hijriDate: shawwalDay,
      })
    ).toStrictEqual({ bySalah: [], general: [] });
  });
});

describe(assertCanCompleteAct, () => {
  it("allows today and past dates and refuses a future date", () => {
    expect(() => assertCanCompleteAct(thursday, thursday)).not.toThrow();
    expect(() =>
      assertCanCompleteAct(thursday.subtract({ days: 30 }), thursday)
    ).not.toThrow();
    expect(() =>
      assertCanCompleteAct(thursday.add({ days: 1 }), thursday)
    ).toThrow(FutureActDateError);
  });
});

describe(unseenPrograms, () => {
  it("lists the Programs the Believer has not opened yet, in their order", () => {
    const programs = [{ id: "a" }, { id: "b" }, { id: "c" }];

    expect(unseenPrograms(programs, new Set(["b"]))).toStrictEqual([
      { id: "a" },
      { id: "c" },
    ]);
    expect(unseenPrograms(programs, new Set(["a", "b", "c"]))).toStrictEqual(
      []
    );
  });
});
