import { Temporal } from "temporal-polyfill";
import { describe, expect, it } from "vitest";

import {
  applyQadaLog,
  DEFAULT_QADA_REMINDER,
  lastQadaSalahLog,
  matchingPreset,
  nextQadaSalahLog,
  presetSalahBacklog,
  QADA_PRESETS,
  qadaCalendar,
  qadaDaysLeft,
  qadaFastLog,
  qadaItemLog,
  qadaReminderPlan,
  qadaToday,
  readQadaLog,
  remainingBacklog,
} from "./qada";
import type {
  QadaBacklog,
  QadaItem,
  QadaLog,
  QadaPace,
  QadaPlan,
} from "./qada";

// 2026-10-15 is a Thursday; its week began on Saturday 2026-10-10.
const TODAY = Temporal.PlainDate.from("2026-10-15");
const YESTERDAY = Temporal.PlainDate.from("2026-10-14");
const date = (iso: string) => Temporal.PlainDate.from(iso);

const backlog = (
  salah: Partial<QadaBacklog["salah"]>,
  fasts = 0
): QadaBacklog => ({
  salah: { fajr: 0, dhuhr: 0, asr: 0, maghrib: 0, isha: 0, ...salah },
  fasts,
});

const MONTH: QadaBacklog = {
  salah: { fajr: 30, dhuhr: 30, asr: 30, maghrib: 30, isha: 30 },
  fasts: 10,
};

const pace = (salahPerDay: number, fastsPerWeek = 0): QadaPace => ({
  salahPerDay,
  fastsPerWeek,
});

/** What the dashboard lists: each item by Salah (or fast) and tick. */
const shown = (items: QadaItem[]) =>
  items.map((item) => [
    item.kind === "fast" ? "fast" : item.salah,
    item.logged,
  ]);

/** Ticks one more `salah` on `day`, as the dashboard or Prayer Log does. */
const tick = (logs: QadaLog[], day: Temporal.PlainDate, salah: "fajr") => [
  ...logs,
  nextQadaSalahLog(logs, day, salah),
];

describe(qadaToday, () => {
  it("lists one of each Salah at a pace of five a day", () => {
    expect(shown(qadaToday(MONTH, pace(5), [], TODAY))).toStrictEqual([
      ["fajr", false],
      ["dhuhr", false],
      ["asr", false],
      ["maghrib", false],
      ["isha", false],
    ]);
  });

  it("lists two of each at a pace of ten, in the day's order", () => {
    expect(
      shown(qadaToday(MONTH, pace(10), [], TODAY)).map(([salah]) => salah)
    ).toStrictEqual([
      "fajr",
      "fajr",
      "dhuhr",
      "dhuhr",
      "asr",
      "asr",
      "maghrib",
      "maghrib",
      "isha",
      "isha",
    ]);
  });

  it("at a slower pace, takes the Salah with the most left first", () => {
    const yesterday: QadaLog[] = ["fajr", "dhuhr", "asr"].map(
      (salah, index) => ({
        id: `y${index}`,
        date: YESTERDAY,
        kind: "salah",
        salah: salah as "fajr",
      })
    );
    expect(
      shown(qadaToday(MONTH, pace(3), yesterday, TODAY)).map(([s]) => s)
    ).toStrictEqual(["fajr", "maghrib", "isha"]);
  });

  it("never asks for a Salah with nothing left", () => {
    expect(
      shown(qadaToday(backlog({ asr: 1 }), pace(5), [], TODAY))
    ).toStrictEqual([["asr", false]]);
    expect(qadaToday(backlog({}), pace(5), [], TODAY)).toStrictEqual([]);
  });

  it("keeps today's list in place as items are ticked", () => {
    const small = backlog({ fajr: 1, isha: 1 });
    const logs = tick([], TODAY, "fajr");
    expect(shown(qadaToday(small, pace(2), logs, TODAY))).toStrictEqual([
      ["fajr", true],
      ["isha", false],
    ]);
  });

  it("shows a Qada Salah logged beyond the plan as one more ticked item", () => {
    const logs = tick(tick([], TODAY, "fajr"), TODAY, "fajr");
    expect(
      shown(qadaToday(MONTH, pace(5), logs, TODAY)).slice(0, 3)
    ).toStrictEqual([
      ["fajr", true],
      ["fajr", true],
      ["dhuhr", false],
    ]);
  });

  it("adds a fast until the week's fasts are kept", () => {
    const fastOnSunday = qadaFastLog(date("2026-10-11"));
    const items = qadaToday(MONTH, pace(1, 2), [fastOnSunday], TODAY);
    expect(shown(items).at(-1)).toStrictEqual(["fast", false]);

    const twoKept = [fastOnSunday, qadaFastLog(date("2026-10-13"))];
    expect(
      shown(qadaToday(MONTH, pace(1, 2), twoKept, TODAY)).at(-1)
    ).toStrictEqual(["fajr", false]);
  });

  it("starts the fasts afresh each Saturday", () => {
    const lastWeek = [
      qadaFastLog(date("2026-10-08")),
      qadaFastLog(date("2026-10-09")),
    ];
    expect(
      shown(qadaToday(MONTH, pace(1, 2), lastWeek, TODAY)).at(-1)
    ).toStrictEqual(["fast", false]);
  });

  it("asks for no fast when none are left", () => {
    expect(
      shown(qadaToday(backlog({ fajr: 3 }), pace(1, 2), [], TODAY))
    ).toStrictEqual([["fajr", false]]);
  });
});

describe(applyQadaLog, () => {
  it("takes one Salah off that Salah's count", () => {
    expect(
      applyQadaLog(MONTH, nextQadaSalahLog([], TODAY, "fajr")).salah
    ).toStrictEqual({ fajr: 29, dhuhr: 30, asr: 30, maghrib: 30, isha: 30 });
  });

  it("takes one fast off the fasts", () => {
    expect(applyQadaLog(MONTH, qadaFastLog(TODAY)).fasts).toBe(9);
  });

  it("never goes below zero", () => {
    expect(
      applyQadaLog(backlog({}), nextQadaSalahLog([], TODAY, "fajr")).salah.fajr
    ).toBe(0);
  });
});

describe(remainingBacklog, () => {
  it("drops by one for each Qada Salah ticked", () => {
    const logs = tick(tick([], YESTERDAY, "fajr"), TODAY, "fajr");
    expect(remainingBacklog(MONTH, logs).salah.fajr).toBe(28);
  });

  it("counts a Qada Salah logged from the Prayer Log and the dashboard once", () => {
    // The dashboard ticks today's first Fajr; the Prayer Log, on another
    // device that had not synced yet, logs a Qada Fajr for today too.
    const [fajr] = qadaToday(MONTH, pace(5), [], TODAY);
    if (!fajr) {
      throw new Error("Today has no Fajr");
    }
    const fromDashboard = qadaItemLog(fajr, TODAY);
    const fromPrayerLog = nextQadaSalahLog([], TODAY, "fajr");
    const logs = [fromDashboard, fromPrayerLog];

    expect(remainingBacklog(MONTH, logs).salah.fajr).toBe(29);
    expect(shown(qadaToday(MONTH, pace(5), logs, TODAY))[0]).toStrictEqual([
      "fajr",
      true,
    ]);
  });
});

describe("ticking any item of a Salah", () => {
  const dhuhrItems = (logs: QadaLog[]) =>
    qadaToday(MONTH, pace(10), logs, TODAY).filter(
      (item) => item.kind === "salah" && item.salah === "dhuhr"
    );
  const second = dhuhrItems([]).at(1);
  if (!second) {
    throw new Error("the plan lists two Dhuhr");
  }
  const dhuhrTwo = qadaItemLog(second, TODAY);

  it("checks the tapped item, not the first of the Salah", () => {
    expect(dhuhrItems([dhuhrTwo]).map((item) => item.logged)).toStrictEqual([
      false,
      true,
    ]);
  });

  it("un-ticks exactly that item by its own log id", () => {
    const logs = [dhuhrTwo];
    const item = dhuhrItems(logs).find((candidate) => candidate.logged);
    expect(item?.id).toBe(dhuhrTwo.id);
    const kept = logs.filter((log) => log.id !== item?.id);
    expect(kept).toStrictEqual([]);
    expect(remainingBacklog(MONTH, kept).salah.dhuhr).toBe(30);
  });

  it("makes the next tick from the lowest free item, never repeating a log id", () => {
    const next = nextQadaSalahLog([dhuhrTwo], TODAY, "dhuhr");
    expect(next.id).toBe("2026-10-15:salah:dhuhr:1");
    expect(nextQadaSalahLog([dhuhrTwo, next], TODAY, "dhuhr").id).toBe(
      "2026-10-15:salah:dhuhr:3"
    );
  });

  it("gives back the highest ticked item from the Prayer Log", () => {
    expect(lastQadaSalahLog([dhuhrTwo], TODAY, "dhuhr")?.id).toBe(dhuhrTwo.id);
  });
});

describe(lastQadaSalahLog, () => {
  it("un-ticks the last Qada Salah of the day, giving it back", () => {
    const logs = tick(tick([], TODAY, "fajr"), TODAY, "fajr");
    const last = lastQadaSalahLog(logs, TODAY, "fajr");
    const kept = logs.filter((log) => log.id !== last?.id);
    expect(remainingBacklog(MONTH, kept).salah.fajr).toBe(29);
  });

  it("has nothing to un-tick when none was logged", () => {
    expect(lastQadaSalahLog([], TODAY, "fajr")).toBeNull();
  });
});

describe(presetSalahBacklog, () => {
  it("offers periods from ten days to two years", () => {
    expect(QADA_PRESETS.map(({ days }) => days)).toStrictEqual([
      10, 30, 180, 360, 540, 720,
    ]);
  });

  it("gives each Salah the preset's days, which match it back", () => {
    const { 3: year } = QADA_PRESETS;
    expect(presetSalahBacklog(year)).toStrictEqual({
      fajr: 360,
      dhuhr: 360,
      asr: 360,
      maghrib: 360,
      isha: 360,
    });
    expect(matchingPreset(presetSalahBacklog(year))).toBe(year);
    expect(matchingPreset({ ...presetSalahBacklog(year), isha: 1 })).toBeNull();
  });
});

describe(qadaDaysLeft, () => {
  it("is the days the pace needs for every Salah left", () => {
    expect(qadaDaysLeft(MONTH, pace(5))).toBe(30);
    expect(qadaDaysLeft(MONTH, pace(4))).toBe(38);
    expect(qadaDaysLeft(backlog({}), pace(5))).toBe(0);
  });
});

describe(qadaCalendar, () => {
  it("shows weeks Saturday to Friday ending with this week, counting each day", () => {
    const logs = tick(tick([], TODAY, "fajr"), TODAY, "fajr");
    const weeks = qadaCalendar([...logs, qadaFastLog(YESTERDAY)], TODAY, 5);
    expect(weeks).toHaveLength(5);
    const thisWeek = weeks.at(-1) ?? [];
    expect(thisWeek.map((day) => day.date.toString())).toStrictEqual([
      "2026-10-10",
      "2026-10-11",
      "2026-10-12",
      "2026-10-13",
      "2026-10-14",
      "2026-10-15",
      "2026-10-16",
    ]);
    expect(thisWeek.map((day) => day.count)).toStrictEqual([
      0, 0, 0, 0, 1, 2, 0,
    ]);
    expect(thisWeek.map((day) => day.future)).toStrictEqual([
      false,
      false,
      false,
      false,
      false,
      false,
      true,
    ]);
    expect(weeks[0]?.[0]?.date.toString()).toBe("2026-09-12");
  });
});

describe(readQadaLog, () => {
  it("reads a stored Qada Salah and fast", () => {
    expect(
      readQadaLog({
        id: "2026-10-15:salah:fajr:1",
        date: "2026-10-15",
        kind: "salah",
        salah: "fajr",
      })
    ).toStrictEqual(nextQadaSalahLog([], TODAY, "fajr"));
    expect(
      readQadaLog({
        id: "2026-10-15:fast",
        date: "2026-10-15",
        kind: "fast",
        salah: null,
      })
    ).toStrictEqual(qadaFastLog(TODAY));
  });

  it("ignores a kind or Salah a newer app synced", () => {
    expect(
      readQadaLog({ id: "x", date: "2026-10-15", kind: "vow", salah: null })
    ).toBeNull();
    expect(
      readQadaLog({ id: "x", date: "2026-10-15", kind: "salah", salah: "duha" })
    ).toBeNull();
  });
});

describe(qadaReminderPlan, () => {
  const plan: QadaPlan = {
    backlog: MONTH,
    pace: pace(5, 2),
    reminder: { ...DEFAULT_QADA_REMINDER, enabled: true },
  };

  it("reminds every day at its time with the day's pace", () => {
    expect(qadaReminderPlan(plan, [])).toStrictEqual({
      schedule: { kind: "daily" },
      reminderAt: 21 * 60,
      salahPerDay: 5,
    });
  });

  it("reminds on the chosen weekdays only", () => {
    expect(
      qadaReminderPlan(
        { ...plan, reminder: { ...plan.reminder, weekdays: [6, 1, 6] } },
        []
      )?.schedule
    ).toStrictEqual({ kind: "weekdays", weekdays: [1, 6] });
  });

  it("is off when disabled, with no weekday, or once all is made up", () => {
    expect(
      qadaReminderPlan({ ...plan, reminder: DEFAULT_QADA_REMINDER }, [])
    ).toBeNull();
    expect(
      qadaReminderPlan(
        { ...plan, reminder: { ...plan.reminder, weekdays: [] } },
        []
      )
    ).toBeNull();
    const oneFajr = { ...plan, backlog: backlog({ fajr: 1 }) };
    expect(qadaReminderPlan(oneFajr, [])).not.toBeNull();
    expect(
      qadaReminderPlan(oneFajr, [nextQadaSalahLog([], TODAY, "fajr")])
    ).toBeNull();
  });
});
