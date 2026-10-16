import { Temporal } from "temporal-polyfill";
import { describe, expect, it } from "vitest";

import type { KhatmahReminderPlan } from "../shared";
import { khatmahReminderSource } from "./khatmah-reminders";

const TODAY = Temporal.PlainDate.from("2026-10-01");

const PLAN: KhatmahReminderPlan = {
  reminderAt: 5 * 60,
  firstDate: TODAY,
  everyDays: 1,
  portions: [
    { from: "1:1", to: "2:141" },
    { from: "2:142", to: "2:252" },
    { from: "2:253", to: "3:92" },
  ],
};

const window = (days: number) => ({
  now: TODAY.toZonedDateTime({ timeZone: "Asia/Riyadh", plainTime: "04:00" }),
  end: TODAY.add({ days }).toZonedDateTime({
    timeZone: "Asia/Riyadh",
    plainTime: "00:00",
  }),
  dates: Array.from({ length: days }, (_, offset) =>
    TODAY.add({ days: offset })
  ),
});

describe(khatmahReminderSource, () => {
  it("names each day's portion at the reminder time", () => {
    const candidates = khatmahReminderSource(PLAN)(window(2));

    expect(candidates.map(({ id }) => id)).toStrictEqual([
      "khatmah:2026-10-01",
      "khatmah:2026-10-02",
    ]);
    expect(candidates[0]?.message).toStrictEqual({
      kind: "khatmah",
      from: "1:1",
      to: "2:141",
    });
    expect(candidates[1]?.message).toMatchObject({ from: "2:142" });
    expect(candidates[0]?.fireAt.toZonedDateTimeISO("Asia/Riyadh").hour).toBe(
      5
    );
  });

  it("starts on the plan's first date, not before", () => {
    const tomorrow = { ...PLAN, firstDate: TODAY.add({ days: 1 }) };

    const candidates = khatmahReminderSource(tomorrow)(window(3));

    expect(candidates.map(({ id }) => id)).toStrictEqual([
      "khatmah:2026-10-02",
      "khatmah:2026-10-03",
    ]);
    expect(candidates[0]?.message).toMatchObject({ from: "1:1" });
  });

  it("stops after the last portion", () => {
    expect(khatmahReminderSource(PLAN)(window(7))).toHaveLength(3);
  });

  it("plans nothing without a plan", () => {
    expect(khatmahReminderSource(null)(window(7))).toHaveLength(0);
  });
});
