import { Temporal } from "temporal-polyfill";

import { isHabitDueOn } from "../shared";
import type { HabitReminderPlan, MessageStyle } from "../shared";
import type { ReminderCandidate, ReminderSource } from "./planner";

/** What a Habit Reminder says; the app words it in its language. */
export interface HabitReminderMessage {
  kind: "habit";
  habitId: string;
  /** The Habit's name, already in the Reminder's language. */
  name: string;
  style: MessageStyle;
}

/**
 * Habit Reminders for the planner's `sources`: one on each date the Habit is
 * due, at its Reminder time on the device's clock. They are not essential, so
 * quiet hours hold them back.
 */
export const habitReminderSource =
  (
    habits: readonly HabitReminderPlan[],
    style: MessageStyle
  ): ReminderSource<HabitReminderMessage> =>
  (window) =>
    window.dates.flatMap((date) =>
      habits
        .filter(({ schedule }) => isHabitDueOn(schedule, date))
        .map(
          ({
            habitId,
            name,
            reminderAt,
          }): ReminderCandidate<HabitReminderMessage> => ({
            id: `habit:${habitId}:${date.toString()}`,
            fireAt: date
              .toZonedDateTime({
                timeZone: window.now.timeZoneId,
                plainTime: new Temporal.PlainTime(
                  Math.floor(reminderAt / 60),
                  reminderAt % 60
                ),
              })
              .toInstant(),
            alert: { kind: "sound", sound: "default" },
            essential: false,
            message: { kind: "habit", habitId, name, style },
          })
        )
    );
