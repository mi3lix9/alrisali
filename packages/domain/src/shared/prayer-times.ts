import { Temporal } from "temporal-polyfill";
import { z } from "zod";

import type { CalculationMethod } from "./calculation-method";

/** The Prayer Times of a day, in the order they fall. */
export const PRAYER_TIMES = [
  "imsak",
  "fajr",
  "sunrise",
  "dhuhr",
  "asr",
  "sunset",
  "maghrib",
  "isha",
  "midnight",
] as const;

export type PrayerTimeName = (typeof PRAYER_TIMES)[number];

export const prayerTimeNameSchema = z.enum(PRAYER_TIMES);

/** Hidden until the Believer turns them on. */
export const DEFAULT_HIDDEN_PRAYER_TIMES: readonly PrayerTimeName[] = [
  "imsak",
  "asr",
  "sunset",
  "isha",
];

export const DEFAULT_IMSAK_MINUTES = 10;
export const MAX_IMSAK_MINUTES = 60;

export const imsakMinutesSchema = z
  .number()
  .int()
  .min(0)
  .max(MAX_IMSAK_MINUTES);

export const TIME_FORMATS = ["12h", "24h"] as const;
export type TimeFormat = (typeof TIME_FORMATS)[number];
export const DEFAULT_TIME_FORMAT: TimeFormat = "24h";
export const timeFormatSchema = z.enum(TIME_FORMATS);

/**
 * Hidden Prayer Times from a stored value of unknown shape: anything that is
 * not a Prayer Time is dropped, as are repeats, and the order is the day's.
 */
export const readHiddenPrayerTimes = (stored: unknown): PrayerTimeName[] =>
  Array.isArray(stored)
    ? PRAYER_TIMES.filter((name) => stored.includes(name))
    : [...DEFAULT_HIDDEN_PRAYER_TIMES];

/** The Hidden Prayer Times after the Believer shows or hides `name`. */
export const setPrayerTimeVisible = (
  hidden: readonly PrayerTimeName[],
  name: PrayerTimeName,
  visible: boolean
): PrayerTimeName[] =>
  PRAYER_TIMES.filter((candidate) =>
    candidate === name ? !visible : hidden.includes(candidate)
  );

export interface Coordinates {
  latitude: number;
  longitude: number;
}

/** What a day's Prayer Times depend on, besides the date and time zone. */
export interface PrayerTimesSettings {
  coordinates: Coordinates;
  calculationMethod: CalculationMethod;
  imsakMinutes: number;
}

/**
 * Each Prayer Time of one date, in the time zone it was asked for. A time is
 * null where the sun never reaches its angle that day (Fajr and Isha in a
 * high-latitude summer); Midnight and Imsak follow Fajr.
 */
export type PrayerTimes = Record<PrayerTimeName, Temporal.ZonedDateTime | null>;

interface MethodRules {
  fajrAngle: number;
  ishaAngle: number;
  asrShadowFactor: number;
  /** Degrees below the horizon at Sunset. */
  sunsetAngle: number;
  /** Degrees below the horizon at Maghrib; null when Maghrib is Sunset. */
  maghribAngle: number | null;
}

/** The sun's upper limb touches the horizon, with refraction. */
const HORIZON_ANGLE = 0.833;

const METHOD_RULES: Record<CalculationMethod, MethodRules> = {
  jafari: {
    fajrAngle: 18,
    ishaAngle: 17,
    asrShadowFactor: 1,
    sunsetAngle: 0,
    maghribAngle: 4,
  },
  sunni: {
    fajrAngle: 18,
    ishaAngle: 17,
    asrShadowFactor: 1,
    sunsetAngle: HORIZON_ANGLE,
    maghribAngle: null,
  },
  hanafi: {
    fajrAngle: 18,
    ishaAngle: 17,
    asrShadowFactor: 2,
    sunsetAngle: HORIZON_ANGLE,
    maghribAngle: null,
  },
  ibadi: {
    fajrAngle: 18,
    ishaAngle: 18,
    asrShadowFactor: 1,
    sunsetAngle: HORIZON_ANGLE,
    maghribAngle: null,
  },
};

const DHUHR_AFTER_NOON_MINUTES = 1;

const HOURS_PER_DAY = 24;
const DEGREES_PER_HOUR = 15;
const NOON = 12;
const RADIANS = Math.PI / 180;

const sin = (degrees: number) => Math.sin(degrees * RADIANS);
const cos = (degrees: number) => Math.cos(degrees * RADIANS);
const tan = (degrees: number) => Math.tan(degrees * RADIANS);
const arcsin = (x: number) => Math.asin(x) / RADIANS;
const arccos = (x: number) => Math.acos(x) / RADIANS;
const arccot = (x: number) => Math.atan(1 / x) / RADIANS;
const arctan2 = (y: number, x: number) => Math.atan2(y, x) / RADIANS;
const wrap = (value: number, range: number) =>
  value - range * Math.floor(value / range);

/** Julian date at 0h UTC of a Gregorian date. */
const julianDate = ({ year, month, day }: Temporal.PlainDate): number => {
  const shifted = month <= 2;
  const y = shifted ? year - 1 : year;
  const m = shifted ? month + 12 : month;
  const century = Math.floor(y / 100);
  const gregorian = 2 - century + Math.floor(century / 4);
  return (
    Math.floor(365.25 * (y + 4716)) +
    Math.floor(30.6001 * (m + 1)) +
    day +
    gregorian -
    1524.5
  );
};

/** The sun's declination and the equation of time (hours) at a Julian date. */
const sunPosition = (jd: number) => {
  const days = jd - 2_451_545;
  const meanAnomaly = wrap(357.529 + 0.98560028 * days, 360);
  const meanLongitude = wrap(280.459 + 0.98564736 * days, 360);
  const longitude = wrap(
    meanLongitude + 1.915 * sin(meanAnomaly) + 0.02 * sin(2 * meanAnomaly),
    360
  );
  const obliquity = 23.439 - 3.6e-7 * days;
  const rightAscension =
    arctan2(cos(obliquity) * sin(longitude), cos(longitude)) / DEGREES_PER_HOUR;
  return {
    declination: arcsin(sin(obliquity) * sin(longitude)),
    equationOfTime:
      meanLongitude / DEGREES_PER_HOUR - wrap(rightAscension, HOURS_PER_DAY),
  };
};

/**
 * Solar calculations for one date and place. Times are hours of local mean
 * solar time; each is refined once by taking the sun's position at a first
 * guess of the time.
 */
const solarDay = (
  date: Temporal.PlainDate,
  { latitude, longitude }: Coordinates
) => {
  const localMidnight =
    julianDate(date) - longitude / (DEGREES_PER_HOUR * HOURS_PER_DAY);
  const sunAt = (hours: number) =>
    sunPosition(localMidnight + hours / HOURS_PER_DAY);
  const noonAt = (hours: number) =>
    wrap(NOON - sunAt(hours).equationOfTime, HOURS_PER_DAY);

  /** When the sun is `angle` degrees below the horizon, or NaN if never. */
  const sunAngleTime = (angle: number, guess: number, morning: boolean) => {
    const { declination } = sunAt(guess);
    const cosine =
      (-sin(angle) - sin(declination) * sin(latitude)) /
      (cos(declination) * cos(latitude));
    const offset = arccos(cosine) / DEGREES_PER_HOUR;
    return noonAt(guess) + (morning ? -offset : offset);
  };

  const asrTime = (shadowFactor: number, guess: number) => {
    const { declination } = sunAt(guess);
    const altitude = arccot(
      shadowFactor + tan(Math.abs(latitude - declination))
    );
    return sunAngleTime(-altitude, guess, false);
  };

  /** Local mean solar hours to an instant. */
  const toInstant = (hours: number): Temporal.Instant | null =>
    Number.isFinite(hours)
      ? Temporal.Instant.fromEpochMilliseconds(
          Math.round(
            date.toZonedDateTime("UTC").epochMilliseconds +
              (hours - longitude / DEGREES_PER_HOUR) * 3_600_000
          )
        ).round({ smallestUnit: "minute", roundingMode: "halfExpand" })
      : null;

  return { noonAt, sunAngleTime, asrTime, toInstant };
};

const FIRST_GUESS = {
  fajr: 5,
  sunrise: 6,
  noon: 12,
  asr: 13,
  sunset: 18,
} as const;

const fajrInstant = (
  date: Temporal.PlainDate,
  settings: PrayerTimesSettings
) => {
  const day = solarDay(date, settings.coordinates);
  const rules = METHOD_RULES[settings.calculationMethod];
  return day.toInstant(
    day.sunAngleTime(rules.fajrAngle, FIRST_GUESS.fajr, true)
  );
};

/** The Prayer Times of `date` at the settings' place, in `timeZone` (IANA). */
export const calculatePrayerTimes = (
  date: Temporal.PlainDate,
  timeZone: string,
  settings: PrayerTimesSettings
): PrayerTimes => {
  const rules = METHOD_RULES[settings.calculationMethod];
  const day = solarDay(date, settings.coordinates);

  const fajr = fajrInstant(date, settings);
  const sunset = day.toInstant(
    day.sunAngleTime(rules.sunsetAngle, FIRST_GUESS.sunset, false)
  );
  const maghribAtAngle =
    rules.maghribAngle === null
      ? null
      : day.toInstant(
          day.sunAngleTime(rules.maghribAngle, FIRST_GUESS.sunset, false)
        );
  // At high latitudes the sun may never reach the Maghrib angle.
  const maghrib = maghribAtAngle ?? sunset;
  const nextFajr = fajrInstant(date.add({ days: 1 }), settings);
  const midnight =
    sunset && nextFajr
      ? Temporal.Instant.fromEpochMilliseconds(
          (sunset.epochMilliseconds + nextFajr.epochMilliseconds) / 2
        ).round({ smallestUnit: "minute", roundingMode: "halfExpand" })
      : null;

  const shown = (instant: Temporal.Instant | null) =>
    instant?.toZonedDateTimeISO(timeZone) ?? null;

  return {
    imsak: shown(fajr?.subtract({ minutes: settings.imsakMinutes }) ?? null),
    fajr: shown(fajr),
    sunrise: shown(
      day.toInstant(day.sunAngleTime(HORIZON_ANGLE, FIRST_GUESS.sunrise, true))
    ),
    dhuhr: shown(
      day
        .toInstant(day.noonAt(FIRST_GUESS.noon))
        ?.add({ minutes: DHUHR_AFTER_NOON_MINUTES }) ?? null
    ),
    asr: shown(
      day.toInstant(day.asrTime(rules.asrShadowFactor, FIRST_GUESS.asr))
    ),
    sunset: shown(sunset),
    maghrib: shown(maghrib),
    isha: shown(
      day.toInstant(
        day.sunAngleTime(rules.ishaAngle, FIRST_GUESS.sunset, false)
      )
    ),
    midnight: shown(midnight),
  };
};

export interface PrayerTimeAt {
  name: PrayerTimeName;
  at: Temporal.ZonedDateTime;
}

/**
 * The visible Prayer Times around `now`, from yesterday to tomorrow, in
 * order. Yesterday is included because its Midnight can fall after 00:00.
 */
const visibleAround = (
  now: Temporal.ZonedDateTime,
  settings: PrayerTimesSettings,
  hidden: readonly PrayerTimeName[]
): PrayerTimeAt[] => {
  const today = now.toPlainDate();
  return [today.subtract({ days: 1 }), today, today.add({ days: 1 })]
    .flatMap((date) => {
      const times = calculatePrayerTimes(date, now.timeZoneId, settings);
      return PRAYER_TIMES.filter((name) => !hidden.includes(name)).flatMap(
        (name) => {
          const at = times[name];
          return at ? [{ name, at }] : [];
        }
      );
    })
    .toSorted((a, b) => Temporal.ZonedDateTime.compare(a.at, b.at));
};

/** The next visible Prayer Time after `now`, in now's time zone. */
export const nextPrayerTime = (
  now: Temporal.ZonedDateTime,
  settings: PrayerTimesSettings,
  hidden: readonly PrayerTimeName[]
): PrayerTimeAt | null =>
  visibleAround(now, settings, hidden).find(
    ({ at }) => Temporal.ZonedDateTime.compare(at, now) > 0
  ) ?? null;

/** The latest visible Prayer Time that has begun by `now`. */
export const currentPrayerTime = (
  now: Temporal.ZonedDateTime,
  settings: PrayerTimesSettings,
  hidden: readonly PrayerTimeName[]
): PrayerTimeAt | null =>
  visibleAround(now, settings, hidden).findLast(
    ({ at }) => Temporal.ZonedDateTime.compare(at, now) <= 0
  ) ?? null;
