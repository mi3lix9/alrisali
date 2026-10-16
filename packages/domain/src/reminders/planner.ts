import { Temporal } from "temporal-polyfill";

import { calculatePrayerTimes, locationTimeZone } from "../shared";
import type { MessageStyle, PrayerTimesSettings } from "../shared";
import { CLASSIC_SAYINGS } from "./sayings";
import type { ClassicSaying } from "./sayings";
import { isInQuietHours, reminderAlert, SALAH } from "./settings";
import type {
  ReminderAlert,
  ReminderRule,
  ReminderSettings,
  Salah,
} from "./settings";

/** iOS keeps at most 64 pending local notifications per app. */
export const PENDING_REMINDER_LIMIT = 64;

/** How many days ahead the planner looks, from today. */
export const REMINDER_WINDOW_DAYS = 14;

/** The stretch of time being planned, on the device's clock. */
export interface ReminderWindow {
  /** Now, in the device's time zone. Nothing at or before it is planned. */
  now: Temporal.ZonedDateTime;
  /** The local midnight that ends the window. */
  end: Temporal.ZonedDateTime;
  /** Each local date in the window, from today. */
  dates: readonly Temporal.PlainDate[];
}

/** One local notification the planner may schedule. */
export interface ReminderCandidate<Message> {
  /** Stable across plans, so an unchanged Reminder is left scheduled. */
  id: string;
  fireAt: Temporal.Instant;
  alert: ReminderAlert;
  /** Essential Reminders (each Salah, Imsak) still fire in quiet hours. */
  essential: boolean;
  message: Message;
}

/**
 * The generic input: anything else that reminds (Habits) hands the planner
 * its candidates for the window.
 */
export type ReminderSource<Message> = (
  window: ReminderWindow
) => readonly ReminderCandidate<Message>[];

/** What a Prayer Time Reminder says; the app words it in its language. */
export interface PrayerReminderMessage {
  kind: "prayer-time";
  prayerTime: Salah | "imsak";
  /** The Prayer Time itself, on the location's clock. */
  at: Temporal.ZonedDateTime;
  minutesBefore: number;
  style: MessageStyle;
  /** Classic: the saying it carries (`CLASSIC_SAYINGS`). Modern: null. */
  sayingId: string | null;
}

export type PlannedReminder<Message = PrayerReminderMessage> =
  ReminderCandidate<Message>;

export interface PlanRemindersInput<Extra> {
  now: Temporal.ZonedDateTime;
  /** Null until the Believer has a location: no Prayer Time Reminders. */
  prayerTimes: PrayerTimesSettings | null;
  settings: ReminderSettings;
  messageStyle: MessageStyle;
  sources?: readonly ReminderSource<Extra>[];
  days?: number;
  limit?: number;
}

const sayingsFor = (prayerTime: Salah | "imsak"): readonly ClassicSaying[] =>
  CLASSIC_SAYINGS.filter(({ topic }) => {
    if (prayerTime === "imsak") {
      return topic === "imsak";
    }
    return topic === "salah" || (prayerTime === "fajr" && topic === "fajr");
  });

const PRAYER_TIME_ORDER = ["imsak", ...SALAH] as const;

/**
 * The saying for one Reminder: it rotates with the date and the Prayer Time,
 * and stays the same each time that Reminder is planned.
 */
const sayingFor = (
  prayerTime: Salah | "imsak",
  date: Temporal.PlainDate
): string | null => {
  const sayings = sayingsFor(prayerTime);
  const dayNumber = date.since(new Temporal.PlainDate(2000, 1, 1)).days;
  const index =
    (dayNumber * PRAYER_TIME_ORDER.length +
      PRAYER_TIME_ORDER.indexOf(prayerTime)) %
    sayings.length;
  return sayings[index]?.id ?? null;
};

const prayerReminders = (
  window: ReminderWindow,
  prayerTimes: PrayerTimesSettings,
  settings: ReminderSettings,
  style: MessageStyle
): ReminderCandidate<PrayerReminderMessage>[] => {
  // The place's own clock: its dates name the Reminders and its local times
  // word them, whatever zone the device is in. One date more than the
  // window, so a place behind the device still reaches the window's end.
  const timeZone = locationTimeZone(prayerTimes.coordinates);
  const today = window.now.withTimeZone(timeZone).toPlainDate();
  const dates = Array.from({ length: window.dates.length + 1 }, (_, offset) =>
    today.add({ days: offset })
  );
  const rules: [Salah | "imsak", ReminderRule][] = [
    ["imsak", settings.imsak],
    ...SALAH.map((salah): [Salah, ReminderRule] => [
      salah,
      settings.salah[salah],
    ]),
  ];
  return dates.flatMap((date) => {
    const times = calculatePrayerTimes(date, timeZone, prayerTimes);
    return rules.flatMap(([prayerTime, rule]) => {
      const alert = reminderAlert(rule);
      const prayerAt = times[prayerTime];
      if (!alert || !prayerAt) {
        return [];
      }
      const id =
        prayerTime === "imsak"
          ? `imsak:${date.toString()}`
          : `salah:${prayerTime}:${date.toString()}`;
      return [
        {
          id,
          fireAt: prayerAt
            .subtract({ minutes: rule.minutesBefore })
            .toInstant(),
          alert,
          essential: true,
          message: {
            kind: "prayer-time",
            prayerTime,
            at: prayerAt,
            minutesBefore: rule.minutesBefore,
            style,
            sayingId: style === "classic" ? sayingFor(prayerTime, date) : null,
          },
        },
      ];
    });
  });
};

/**
 * The ordered local notifications for the rolling window from now: each
 * enabled Salah and Imsak, plus whatever the sources add, without what has
 * fired, what falls after the window, or non-essential Reminders in quiet
 * hours; the soonest `limit` of them.
 */
export const planReminders = <Extra = never>({
  now,
  prayerTimes,
  settings,
  messageStyle,
  sources = [],
  days = REMINDER_WINDOW_DAYS,
  limit = PENDING_REMINDER_LIMIT,
}: PlanRemindersInput<Extra>): PlannedReminder<
  PrayerReminderMessage | Extra
>[] => {
  const today = now.toPlainDate();
  const window: ReminderWindow = {
    now,
    end: today.add({ days }).toZonedDateTime(now.timeZoneId),
    dates: Array.from({ length: days }, (_, offset) =>
      today.add({ days: offset })
    ),
  };
  const candidates: ReminderCandidate<PrayerReminderMessage | Extra>[] = [
    ...(prayerTimes
      ? prayerReminders(window, prayerTimes, settings, messageStyle)
      : []),
    ...sources.flatMap((source) => source(window)),
  ];
  const nowInstant = now.toInstant();
  const endInstant = window.end.toInstant();
  return candidates
    .filter(({ fireAt, essential }) => {
      if (
        Temporal.Instant.compare(fireAt, nowInstant) <= 0 ||
        Temporal.Instant.compare(fireAt, endInstant) >= 0
      ) {
        return false;
      }
      if (essential) {
        return true;
      }
      const local = fireAt.toZonedDateTimeISO(now.timeZoneId);
      return !isInQuietHours(
        settings.quietHours,
        local.hour * 60 + local.minute
      );
    })
    .toSorted(
      (a, b) =>
        Temporal.Instant.compare(a.fireAt, b.fireAt) || a.id.localeCompare(b.id)
    )
    .slice(0, limit);
};

/** A scheduled (or planned) notification, as far as the diff is concerned. */
export interface ScheduleEntry {
  id: string;
  /** Changes whenever anything the Believer would notice changes. */
  fingerprint: string;
}

/**
 * What to change so the scheduled notifications match the plan: cancel
 * those gone or changed, schedule those new or changed, leave the rest.
 */
export const diffSchedule = <Entry extends ScheduleEntry>(
  scheduled: readonly ScheduleEntry[],
  planned: readonly Entry[]
): { cancel: string[]; schedule: Entry[] } => {
  const plannedById = new Map(planned.map((entry) => [entry.id, entry]));
  const scheduledById = new Map(scheduled.map((entry) => [entry.id, entry]));
  return {
    cancel: scheduled
      .filter(
        ({ id, fingerprint }) =>
          plannedById.get(id)?.fingerprint !== fingerprint
      )
      .map(({ id }) => id),
    schedule: planned.filter(
      ({ id, fingerprint }) =>
        scheduledById.get(id)?.fingerprint !== fingerprint
    ),
  };
};
