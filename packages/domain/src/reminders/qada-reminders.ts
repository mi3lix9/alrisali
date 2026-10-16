import { Temporal } from "temporal-polyfill";

import { isHabitDueOn } from "../shared";
import type { QadaReminderPlan } from "../shared";
import type { ReminderCandidate, ReminderSource } from "./planner";

/** What the Qada Reminder says; the app words it in its language. */
export interface QadaReminderMessage {
  kind: "qada";
  /** Qada Salah the pace asks for each day. */
  salahPerDay: number;
}

/**
 * The Qada Reminder for the planner's `sources`: one on each of its weekdays,
 * at its time on the device's clock; none while it is off (`null`). It is
 * not essential, so quiet hours hold it back.
 */
export const qadaReminderSource =
  (plan: QadaReminderPlan | null): ReminderSource<QadaReminderMessage> =>
  (window) =>
    plan === null
      ? []
      : window.dates
          .filter((date) => isHabitDueOn(plan.schedule, date))
          .map((date): ReminderCandidate<QadaReminderMessage> => ({
            id: `qada:${date.toString()}`,
            fireAt: date
              .toZonedDateTime({
                timeZone: window.now.timeZoneId,
                plainTime: new Temporal.PlainTime(
                  Math.floor(plan.reminderAt / 60),
                  plan.reminderAt % 60
                ),
              })
              .toInstant(),
            alert: { kind: "sound", sound: "default" },
            essential: false,
            message: { kind: "qada", salahPerDay: plan.salahPerDay },
          }));
