import type { AyahKey } from "@alrisali/content/quran";
import { Temporal } from "temporal-polyfill";

import {
  calculatePrayerTimes,
  currentPrayerTime,
  nextPrayerTime,
  PRAYER_TIMES,
} from "../shared";
import type {
  HijriCalendar,
  HijriDate,
  PrayerTimeName,
  PrayerTimesSettings,
} from "../shared";
import { locationTimeZone } from "../shared/time-zone";

/** The home-screen widgets the app offers. */
export const WIDGET_KINDS = [
  "next-salah",
  "today-times",
  "hijri-date",
  "verse-of-the-day",
  "keep-reading",
  "khatmah",
] as const;

export type WidgetKind = (typeof WIDGET_KINDS)[number];

/**
 * How far ahead the timeline reaches: a week, so widgets keep switching on
 * time when the app is not opened for days. The app rewrites it on every launch.
 */
export const WIDGET_HORIZON_HOURS = 168;

/** What the widgets show, read from the Believer's data. */
export interface WidgetInput {
  /** Null while the Believer has no location: then no Prayer Times. */
  prayerTimes: {
    settings: PrayerTimesSettings;
    hidden: readonly PrayerTimeName[];
  } | null;
  /** The zone whose midnight starts a new day when there is no location. */
  deviceTimeZone: string;
  hijri: HijriCalendar;
  /** The Verse of the Day of a date. */
  verse: (date: Temporal.PlainDate) => WidgetVerse;
  /** The Last-Read Ayah, if the Believer has read. */
  lastRead: WidgetLastRead | null;
  /** The Khatmah the Believer is reading on a date, if any. */
  khatmah: (date: Temporal.PlainDate) => WidgetKhatmah | null;
}

/** What the widgets read besides the Prayer Times: the Quran and the Khatmah. */
export type WidgetSources = Pick<WidgetInput, "khatmah" | "lastRead" | "verse">;

export interface WidgetVerse {
  key: AyahKey;
  surah: number;
  ayah: number;
  /** The ayah's text as the Quran holds it, ending in its end sign and number. */
  text: string;
}

export interface WidgetLastRead {
  surah: number;
  ayah: number;
  page: number;
}

export interface WidgetPrayerTime {
  name: PrayerTimeName;
  /** Epoch milliseconds. */
  at: number;
}

export interface WidgetKhatmah {
  id: string;
  state: "on-track" | "ahead" | "behind" | "finished";
  done: number;
  total: number;
  pagesRead: number;
  completedToday: boolean;
  /** How many sessions ahead or behind; 0 on track. */
  sessions: number;
  /** Today's portion; null once finished. */
  current: { number: number; from: AyahKey; to: AyahKey; pages: number } | null;
}

/** Everything the widgets show from `from` until the next entry. */
export interface WidgetEntry {
  /** Epoch milliseconds this entry takes over from the one before it. */
  from: number;
  /** The place's own zone, or the device's without a location. */
  timeZone: string;
  /** The day of `from` in `timeZone`, `YYYY-MM-DD`. */
  date: string;
  /** The next visible Prayer Time after `from`. */
  next: WidgetPrayerTime | null;
  /** The visible Prayer Time in force at `from`. */
  current: PrayerTimeName | null;
  /** The visible Prayer Times of `date`, in order. */
  times: WidgetPrayerTime[];
  hijri: HijriDate;
  verse: WidgetVerse;
  lastRead: WidgetLastRead | null;
  khatmah: WidgetKhatmah | null;
}

const MS_PER_HOUR = 3_600_000;
/** A guard against a loop that fails to advance. */
const MAX_PRAYER_TIMES = PRAYER_TIMES.length * 4;

const entryAt = (input: WidgetInput, at: Temporal.Instant): WidgetEntry => {
  const { prayerTimes } = input;
  const timeZone = prayerTimes
    ? locationTimeZone(prayerTimes.settings.coordinates)
    : input.deviceTimeZone;
  const date = at.toZonedDateTimeISO(timeZone).toPlainDate();

  let next: WidgetPrayerTime | null = null;
  let current: PrayerTimeName | null = null;
  let times: WidgetPrayerTime[] = [];
  if (prayerTimes) {
    const { settings, hidden } = prayerTimes;
    const following = nextPrayerTime(at, settings, hidden);
    next = following && {
      name: following.name,
      at: following.at.epochMilliseconds,
    };
    current = currentPrayerTime(at, settings, hidden)?.name ?? null;
    const day = calculatePrayerTimes(date, timeZone, settings);
    times = PRAYER_TIMES.filter((name) => !hidden.includes(name)).flatMap(
      (name) => {
        const time = day[name];
        return time ? [{ name, at: time.epochMilliseconds }] : [];
      }
    );
  }

  return {
    from: at.epochMilliseconds,
    timeZone,
    date: date.toString(),
    next,
    current,
    times,
    hijri: input.hijri.toHijri(date),
    verse: input.verse(date),
    lastRead: input.lastRead,
    khatmah: input.khatmah(date),
  };
};

/** The instants after `now`, up to `until`, where any widget changes. */
const changeInstants = (
  input: WidgetInput,
  now: Temporal.Instant,
  until: Temporal.Instant,
  timeZone: string
): number[] => {
  const instants = new Set<number>();
  const { prayerTimes } = input;
  if (prayerTimes) {
    let cursor = now;
    for (let count = 0; count < MAX_PRAYER_TIMES; count += 1) {
      const next = nextPrayerTime(
        cursor,
        prayerTimes.settings,
        prayerTimes.hidden
      );
      if (!next || Temporal.Instant.compare(next.at.toInstant(), until) > 0) {
        break;
      }
      instants.add(next.at.epochMilliseconds);
      cursor = next.at.toInstant();
    }
  }
  // The day turns at the place's midnight: Hijri Date, Verse of the Day, the
  // day's times and today's Khatmah portion all change with it.
  let day = now.toZonedDateTimeISO(timeZone).toPlainDate().add({ days: 1 });
  for (;;) {
    const midnight = day.toZonedDateTime(timeZone).toInstant();
    if (Temporal.Instant.compare(midnight, until) > 0) {
      break;
    }
    instants.add(midnight.epochMilliseconds);
    day = day.add({ days: 1 });
  }
  return [...instants];
};

/**
 * What the widgets show from `now` on: one entry for now and one for each
 * moment something changes in the next `WIDGET_HORIZON_HOURS` (every visible
 * Prayer Time, and midnight), so the next-Salah widget switches on time.
 */
export const widgetEntries = (
  input: WidgetInput,
  now: Temporal.Instant
): WidgetEntry[] => {
  const first = entryAt(input, now);
  const until = now.add({ milliseconds: WIDGET_HORIZON_HOURS * MS_PER_HOUR });
  const later = changeInstants(input, now, until, first.timeZone)
    .toSorted((a, b) => a - b)
    .map((epoch) =>
      entryAt(input, Temporal.Instant.fromEpochMilliseconds(epoch))
    );
  return [first, ...later];
};
