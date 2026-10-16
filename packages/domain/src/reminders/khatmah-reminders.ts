import { Temporal } from "temporal-polyfill";

import type { KhatmahReminderPlan } from "../shared";
import type { ReminderCandidate, ReminderSource } from "./planner";

/** What the Khatmah Reminder says; the app words it in its language. */
export interface KhatmahReminderMessage {
  kind: "khatmah";
  /** The first and last ayah (`surah:ayah`) of the portion to read. */
  from: `${number}:${number}`;
  to: `${number}:${number}`;
}

/**
 * The Khatmah's daily Reminder for the planner's `sources`: one per session
 * day while portions remain, at its time on the device's clock, naming that day's
 * portion; none without a Khatmah reminder (`null`). It is not essential, so
 * quiet hours hold it back.
 */
export const khatmahReminderSource =
  (plan: KhatmahReminderPlan | null): ReminderSource<KhatmahReminderMessage> =>
  (window) =>
    plan === null
      ? []
      : window.dates.flatMap((date) => {
          const offset = plan.firstDate.until(date, {
            largestUnit: "days",
          }).days;
          const portion = plan.portions[Math.floor(offset / plan.everyDays)];
          if (offset < 0 || offset % plan.everyDays !== 0 || !portion) {
            return [];
          }
          return [
            {
              id: `khatmah:${date.toString()}`,
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
              message: { kind: "khatmah", ...portion },
            } satisfies ReminderCandidate<KhatmahReminderMessage>,
          ];
        });
