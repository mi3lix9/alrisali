import { Temporal } from "temporal-polyfill";
import { describe, expect, it } from "vitest";

import type { QadaReminderPlan } from "../shared";
import { planReminders } from "./planner";
import { qadaReminderSource } from "./qada-reminders";
import { DEFAULT_REMINDER_SETTINGS } from "./settings";

// Thursday 15 October 2026, noon in Baghdad.
const NOON = Temporal.ZonedDateTime.from("2026-10-15T12:00[Asia/Baghdad]");

const nightly: QadaReminderPlan = {
  schedule: { kind: "daily" },
  reminderAt: 21 * 60,
  salahPerDay: 5,
};

const planQada = (
  plan: QadaReminderPlan | null,
  overrides: { quiet?: boolean } = {}
) =>
  planReminders({
    now: NOON,
    prayerTimes: null,
    settings: overrides.quiet
      ? {
          ...DEFAULT_REMINDER_SETTINGS,
          quietHours: { enabled: true, start: 20 * 60, end: 6 * 60 },
        }
      : DEFAULT_REMINDER_SETTINGS,
    messageStyle: "modern",
    sources: [qadaReminderSource(plan)],
    days: 3,
  });

const local = (reminders: readonly { fireAt: Temporal.Instant }[]) =>
  reminders.map(({ fireAt }) =>
    fireAt
      .toZonedDateTimeISO("Asia/Baghdad")
      .toPlainDateTime()
      .toString({ smallestUnit: "minute" })
  );

describe(qadaReminderSource, () => {
  it("reminds at its time each day, from today", () => {
    const planned = planQada(nightly);
    expect(local(planned)).toStrictEqual([
      "2026-10-15T21:00",
      "2026-10-16T21:00",
      "2026-10-17T21:00",
    ]);
    expect(planned[0]).toMatchObject({
      id: "qada:2026-10-15",
      essential: false,
      message: { kind: "qada", salahPerDay: 5 },
    });
  });

  it("reminds only on the chosen weekdays", () => {
    // Every day but Friday: Thursday the 15th and Saturday the 17th.
    const planned = planQada({
      ...nightly,
      schedule: { kind: "weekdays", weekdays: [1, 2, 3, 4, 6, 7] },
    });
    expect(local(planned)).toStrictEqual([
      "2026-10-15T21:00",
      "2026-10-17T21:00",
    ]);
  });

  it("plans nothing while the reminder is off", () => {
    expect(planQada(null)).toStrictEqual([]);
  });

  it("is held back in quiet hours", () => {
    expect(planQada(nightly, { quiet: true })).toStrictEqual([]);
  });
});
