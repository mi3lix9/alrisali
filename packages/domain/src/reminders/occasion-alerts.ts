import { Temporal } from "temporal-polyfill";
import { z } from "zod";

import {
  calculatePrayerTimes,
  locationTimeZone,
  nightHijriDate,
  OCCASION_TYPES,
  occasionsOn,
} from "../shared";
import type {
  HijriCalendar,
  Occasion,
  OccasionType,
  PrayerTimesSettings,
} from "../shared";
import type { ReminderCandidate, ReminderSource } from "./planner";

/** On the day itself, or on the evening before (from Maghrib). */
export const OCCASION_ALERT_TIMINGS = ["day-of", "evening-before"] as const;

export type OccasionAlertTiming = (typeof OCCASION_ALERT_TIMINGS)[number];

/** How the Believer is alerted to Occasions; off until they opt in. */
export interface OccasionAlertSettings {
  enabled: boolean;
  timing: OccasionAlertTiming;
  /** Minutes after local midnight; the evening before, never ahead of Maghrib. */
  time: number;
  /** Only Occasions of these types alert. */
  types: readonly OccasionType[];
}

export const DEFAULT_OCCASION_ALERT_SETTINGS: OccasionAlertSettings = {
  enabled: false,
  timing: "day-of",
  time: 8 * 60,
  types: OCCASION_TYPES,
};

const timeSchema = z
  .number()
  .int()
  .min(0)
  .max(24 * 60 - 1);

export const occasionAlertSettingsSchema = z.object({
  enabled: z.boolean(),
  timing: z.enum(OCCASION_ALERT_TIMINGS),
  time: timeSchema,
  types: z.array(z.enum(OCCASION_TYPES)),
});

/** The settings to change; anything left out keeps its value. */
export const occasionAlertSettingsChangeSchema =
  occasionAlertSettingsSchema.partial();

export type OccasionAlertSettingsChange = z.input<
  typeof occasionAlertSettingsChangeSchema
>;

/**
 * Settings from a stored value of unknown shape: each invalid field falls
 * back, so a value from a newer app never loses the rest. Types of a type this
 * app does not know are dropped; the rest are kept once each.
 */
export const readOccasionAlertSettings = (
  stored: Partial<Record<keyof OccasionAlertSettings, unknown>>,
  fallback: OccasionAlertSettings = DEFAULT_OCCASION_ALERT_SETTINGS
): OccasionAlertSettings => {
  const enabled = occasionAlertSettingsSchema.shape.enabled.safeParse(
    stored.enabled
  );
  const timing = occasionAlertSettingsSchema.shape.timing.safeParse(
    stored.timing
  );
  const time = occasionAlertSettingsSchema.shape.time.safeParse(stored.time);
  const types = z.array(z.unknown()).safeParse(stored.types);
  return {
    enabled: enabled.success ? enabled.data : fallback.enabled,
    timing: timing.success ? timing.data : fallback.timing,
    time: time.success ? time.data : fallback.time,
    types: types.success
      ? OCCASION_TYPES.filter((type) => types.data.includes(type))
      : fallback.types,
  };
};

/** The settings after a validated change. */
export const applyOccasionAlertSettingsChange = (
  settings: OccasionAlertSettings,
  change: OccasionAlertSettingsChange
): OccasionAlertSettings =>
  readOccasionAlertSettings(
    occasionAlertSettingsChangeSchema.parse(change),
    settings
  );

/** What an Occasion alert says; the app words it in its language. */
export interface OccasionReminderMessage {
  kind: "occasion";
  occasionId: string;
  type: OccasionType;
  name: { ar: string; en: string };
  timing: OccasionAlertTiming;
}

/** Maghrib of a civil date at the Believer's place; null without a place. */
export type MaghribOf = (
  date: Temporal.PlainDate
) => Temporal.ZonedDateTime | null;

/** Maghrib by the Believer's Prayer Times settings; null without a location. */
export const maghribFrom = (
  prayerTimes: PrayerTimesSettings | null
): MaghribOf =>
  function maghribOf(date) {
    return prayerTimes
      ? calculatePrayerTimes(
          date,
          locationTimeZone(prayerTimes.coordinates),
          prayerTimes
        ).maghrib
      : null;
  };

/**
 * Occasion alerts for the planner's `sources`, in the order the planner
 * ranks them with everything else (so they share its 64 limit). On the day:
 * each Occasion of the civil date's Hijri Date, at the chosen time. On the
 * evening before: each Occasion of the next Hijri Date (`nightHijriDate`, which
 * turns at Maghrib), at the chosen time or at Maghrib if that is later; none
 * without a Maghrib. Not essential, so quiet hours hold them back.
 */
export const occasionReminderSource =
  ({
    settings,
    occasions,
    calendar,
    maghribOf,
  }: {
    settings: OccasionAlertSettings;
    occasions: readonly Occasion[];
    calendar: HijriCalendar;
    maghribOf: MaghribOf;
  }): ReminderSource<OccasionReminderMessage> =>
  (window) => {
    if (!settings.enabled || settings.types.length === 0) {
      return [];
    }
    const wanted = occasions.filter(({ type }) =>
      settings.types.includes(type)
    );
    const { timing } = settings;
    const plainTime = new Temporal.PlainTime(
      Math.floor(settings.time / 60),
      settings.time % 60
    );
    return window.dates.flatMap((date) => {
      const maghrib = timing === "evening-before" ? maghribOf(date) : null;
      if (timing === "evening-before" && maghrib === null) {
        return [];
      }
      const hijri = maghrib
        ? nightHijriDate(maghrib, maghrib, calendar)
        : calendar.toHijri(date);
      const chosen = date
        .toZonedDateTime({ timeZone: window.now.timeZoneId, plainTime })
        .toInstant();
      const fireAt =
        maghrib && Temporal.Instant.compare(maghrib.toInstant(), chosen) > 0
          ? maghrib.toInstant()
          : chosen;
      return occasionsOn(
        hijri,
        calendar.monthLength(hijri.year, hijri.month),
        wanted
      ).map(
        ({ id, type, name }): ReminderCandidate<OccasionReminderMessage> => ({
          id: `occasion:${id}:${date.toString()}:${timing}`,
          fireAt,
          alert: { kind: "sound", sound: "default" },
          essential: false,
          message: { kind: "occasion", occasionId: id, type, name, timing },
        })
      );
    });
  };
