import type { Temporal } from "temporal-polyfill";
import { z } from "zod";

import {
  calculatePrayerTimes,
  createHijriCalendar,
  locationTimeZone,
  nightHijriDate,
} from "../shared";
import type { HijriCalendar, HijriDate, PrayerTimesSettings } from "../shared";
import type { ReminderCandidate, ReminderSource } from "./planner";

/** The worship the Believer may be reminded of, each its own opt-in. */
export const NIGHT_DUA_ALERTS = [
  "kumayl",
  "tawassul",
  "nudba",
  "ziyarah",
] as const;

export type NightDuaAlert = (typeof NIGHT_DUA_ALERTS)[number];

/** Which of them the Believer turned on. */
export type NightDuaAlerts = Record<NightDuaAlert, boolean>;

/** All off: nothing is reminded until the Believer opts in. */
export const DEFAULT_NIGHT_DUA_ALERTS: NightDuaAlerts = {
  kumayl: false,
  tawassul: false,
  nudba: false,
  ziyarah: false,
};

export const nightDuaAlertsChangeSchema = z
  .object({
    kumayl: z.boolean(),
    tawassul: z.boolean(),
    nudba: z.boolean(),
    ziyarah: z.boolean(),
  })
  .partial();

export type NightDuaAlertsChange = z.infer<typeof nightDuaAlertsChangeSchema>;

/** A night dua after Maghrib, or a morning one at sunrise. */
export type NightDuaTiming = "night" | "morning";

interface NightDuaRule {
  /** ISO weekday of the civil day it falls on (1 is Monday). */
  isoDay: number;
  timing: NightDuaTiming;
  /**
   * The bundled Supplication it opens; null where no Book holds the text, so
   * the Reminder only names the dua.
   */
  supplicationId: string | null;
}

/**
 * Kumayl on Thursday night (the night of Friday), Tawassul on Tuesday night
 * and Nudba on Friday morning. Ziyarah follows the worship mapping instead.
 */
export const NIGHT_DUA_RULES: Record<
  Exclude<NightDuaAlert, "ziyarah">,
  NightDuaRule
> = {
  kumayl: { isoDay: 4, timing: "night", supplicationId: "mafatih-dua-kumayl" },
  tawassul: { isoDay: 2, timing: "night", supplicationId: null },
  nudba: { isoDay: 5, timing: "morning", supplicationId: "mafatih-dua-nudba" },
};

/** A night Reminder comes this long after Maghrib, once the Salah is done. */
export const NIGHT_DUA_AFTER_MAGHRIB_MINUTES = 30;

/** What a night-dua Reminder says; the app words it in its language. */
export interface NightDuaReminderMessage {
  kind: "night-dua";
  alert: NightDuaAlert;
  /** The Supplications it names; empty for Tawassul (no bundled text). */
  supplicationIds: readonly string[];
  /**
   * The Hijri Date of that night, from `nightHijriDate`: after Maghrib it is
   * already the next Hijri day.
   */
  hijri: HijriDate;
}

/** What the source plans from. */
export interface NightDuaPlan {
  alerts: NightDuaAlerts;
  /** Null until the Believer has a location: Maghrib and sunrise are unknown. */
  prayerTimes: PrayerTimesSettings | null;
  /** The worship mapping Admins publish (ziyarah by weekday). */
  worship: readonly { kind: string; day: string; supplicationId: string }[];
  hijri?: HijriCalendar;
}

// ISO `dayOfWeek` order: 1 is Monday.
const WEEKDAY_NAMES = [
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
  "sunday",
] as const;

/**
 * The night-dua Reminders for the planner's `sources`, on the place's own
 * clock: Kumayl and Tawassul after Maghrib of their weekday, Nudba and the
 * ziyarah of the day at sunrise. Each is its own toggle, none are essential
 * (quiet hours hold them back), and none without a location.
 */
export const nightDuaReminderSource =
  ({
    alerts,
    prayerTimes,
    worship,
    hijri = createHijriCalendar(),
  }: NightDuaPlan): ReminderSource<NightDuaReminderMessage> =>
  (window) => {
    if (prayerTimes === null || !NIGHT_DUA_ALERTS.some((a) => alerts[a])) {
      return [];
    }
    const timeZone = locationTimeZone(prayerTimes.coordinates);
    const today = window.now.withTimeZone(timeZone).toPlainDate();
    // One date more than the window, so a place behind the device still
    // reaches the window's end.
    return Array.from({ length: window.dates.length + 1 }, (_, offset) =>
      today.add({ days: offset })
    ).flatMap((date) => {
      const times = calculatePrayerTimes(date, timeZone, prayerTimes);
      const candidate = (
        alert: NightDuaAlert,
        at: Temporal.ZonedDateTime,
        supplicationIds: readonly string[]
      ): ReminderCandidate<NightDuaReminderMessage> => ({
        id: `night-dua:${date.toString()}:${alert}`,
        fireAt: at.toInstant(),
        alert: { kind: "sound", sound: "default" },
        essential: false,
        message: {
          kind: "night-dua",
          alert,
          supplicationIds,
          hijri: nightHijriDate(at, times.maghrib, hijri),
        },
      });
      const found: ReminderCandidate<NightDuaReminderMessage>[] = [];
      for (const [alert, rule] of Object.entries(NIGHT_DUA_RULES) as [
        keyof typeof NIGHT_DUA_RULES,
        NightDuaRule,
      ][]) {
        if (!alerts[alert] || date.dayOfWeek !== rule.isoDay) {
          continue;
        }
        const at =
          rule.timing === "night"
            ? times.maghrib?.add({ minutes: NIGHT_DUA_AFTER_MAGHRIB_MINUTES })
            : times.sunrise;
        if (at) {
          found.push(
            candidate(
              alert,
              at,
              rule.supplicationId ? [rule.supplicationId] : []
            )
          );
        }
      }
      const ziyarah = worship
        .filter(
          ({ kind, day }) =>
            kind === "ziyarah" && day === WEEKDAY_NAMES[date.dayOfWeek - 1]
        )
        .map(({ supplicationId }) => supplicationId);
      if (alerts.ziyarah && ziyarah.length > 0 && times.sunrise) {
        found.push(candidate("ziyarah", times.sunrise, ziyarah));
      }
      return found;
    });
  };
