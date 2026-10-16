import { Temporal } from "temporal-polyfill";

import {
  calculatePrayerTimes,
  createHijriCalendar,
  isInHijriWindow,
} from "../shared";
import type {
  HijriCalendar,
  HijriWindow,
  MessageStyle,
  PrayerTimesSettings,
} from "../shared";
import { CLASSIC_SAYINGS } from "./sayings";
import type { ClassicSaying } from "./sayings";
import { atTimeAlert, isInQuietHours, reminderAlert, SALAH } from "./settings";
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

/**
 * An alert delivered later than this after its time (the device was off, or
 * held it back) is dropped rather than shown late.
 */
export const STALE_ALERT_MINUTES = 30;

/** Whether an alert delivered at `deliveredAt` is too late to show. */
export const isStaleAlert = (
  fireAt: Temporal.Instant,
  deliveredAt: Temporal.Instant
): boolean =>
  Temporal.Instant.compare(
    deliveredAt,
    fireAt.add({ minutes: STALE_ALERT_MINUTES })
  ) > 0;

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

/** Which of a Prayer Time's two alerts: the Reminder before, or At-Time. */
export type PrayerAlertTiming = "before" | "at-time";

/** What a Prayer Time Reminder says; the app words it in its language. */
export interface PrayerReminderMessage {
  kind: "prayer-time";
  prayerTime: Salah | "imsak";
  timing: PrayerAlertTiming;
  /** The Prayer Time itself, on the device's clock. */
  at: Temporal.ZonedDateTime;
  /** 0 for the At-Time Alert. */
  minutesBefore: number;
  style: MessageStyle;
  /** Classic: the saying it carries (`CLASSIC_SAYINGS`). Modern: null. */
  sayingId: string | null;
}

/**
 * A Prayer Time alert's identity: its date, Prayer Time and timing, so no
 * alert ever replaces another.
 */
export const prayerAlertId = (
  date: Temporal.PlainDate,
  prayerTime: Salah | "imsak",
  timing: PrayerAlertTiming
): string => `prayer:${date.toString()}:${prayerTime}:${timing}`;

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
  /**
   * The Believer's Hijri calendar (with the Hijri Adjustment), which tells
   * Ramadan's days; unadjusted when left out.
   */
  hijri?: HijriCalendar;
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

/** Ramadan, whose days alone get Imsak's At-Time Alert by default. */
const RAMADAN: HijriWindow = {
  start: { month: 9, day: 1 },
  end: { month: 9, day: 30 },
};

const prayerReminders = (
  window: ReminderWindow,
  prayerTimes: PrayerTimesSettings,
  settings: ReminderSettings,
  style: MessageStyle,
  hijri: HijriCalendar
): ReminderCandidate<PrayerReminderMessage>[] => {
  const timeZone = window.now.timeZoneId;
  const rules: [Salah | "imsak", ReminderRule][] = [
    ["imsak", settings.imsak],
    ...SALAH.map((salah): [Salah, ReminderRule] => [
      salah,
      settings.salah[salah],
    ]),
  ];
  return window.dates.flatMap((date) => {
    const times = calculatePrayerTimes(date, timeZone, prayerTimes);
    const inRamadan = isInHijriWindow(hijri.toHijri(date), RAMADAN);
    return rules.flatMap(([prayerTime, rule]) => {
      const prayerAt = times[prayerTime];
      if (!prayerAt) {
        return [];
      }
      const sayingId = style === "classic" ? sayingFor(prayerTime, date) : null;
      const before = reminderAlert(rule);
      const atTime =
        prayerTime === "imsak" && settings.imsak.ramadanOnly && !inRamadan
          ? null
          : atTimeAlert(rule);
      const alerts: (readonly [PrayerAlertTiming, ReminderAlert, number])[] = [
        ...(before ? [["before", before, rule.minutesBefore] as const] : []),
        ...(atTime ? [["at-time", atTime, 0] as const] : []),
      ];
      return alerts.map(([timing, alert, minutesBefore]) => ({
        id: prayerAlertId(date, prayerTime, timing),
        fireAt: prayerAt.subtract({ minutes: minutesBefore }).toInstant(),
        alert,
        // Quiet hours hold back only a Salah's Reminder before it.
        essential: timing === "at-time" || prayerTime === "imsak",
        message: {
          kind: "prayer-time",
          prayerTime,
          timing,
          at: prayerAt,
          minutesBefore,
          style,
          sayingId,
        },
      }));
    });
  });
};

/**
 * The ordered local notifications for the rolling window from now: each
 * Salah's and Imsak's Reminder before and At-Time Alert, plus whatever the
 * sources add, without what has fired, what falls after the window, or
 * non-essential Reminders in quiet hours; the soonest `limit` of them.
 */
export const planReminders = <Extra = never>({
  now,
  prayerTimes,
  settings,
  messageStyle,
  sources = [],
  days = REMINDER_WINDOW_DAYS,
  limit = PENDING_REMINDER_LIMIT,
  hijri = createHijriCalendar(),
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
      ? prayerReminders(window, prayerTimes, settings, messageStyle, hijri)
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
