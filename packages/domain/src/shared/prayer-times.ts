import { Temporal } from "temporal-polyfill";
import { z } from "zod";

import { DEFAULT_CUSTOM_ANGLES } from "./calculation-method";
import type { CalculationMethod, CustomAngles } from "./calculation-method";
import { locationTimeZone } from "./time-zone";

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

export const MAX_ADJUSTMENT_MINUTES = 30;

/** A Believer's correction of one Prayer Time, in whole minutes. */
export const adjustmentMinutesSchema = z
  .number()
  .int()
  .min(-MAX_ADJUSTMENT_MINUTES)
  .max(MAX_ADJUSTMENT_MINUTES);

/** Minutes to add to each Prayer Time; a time left out is not adjusted. */
export const prayerAdjustmentsSchema = z.partialRecord(
  prayerTimeNameSchema,
  adjustmentMinutesSchema
);

export type PrayerAdjustments = z.infer<typeof prayerAdjustmentsSchema>;

/**
 * Adjustments from a stored value of unknown shape: each Prayer Time whose
 * value is a valid number of minutes is kept, the rest are dropped, and
 * zeros are not stored.
 */
export const readPrayerAdjustments = (stored: unknown): PrayerAdjustments => {
  if (typeof stored !== "object" || stored === null) {
    return {};
  }
  return Object.fromEntries(
    PRAYER_TIMES.flatMap((name) => {
      const minutes = adjustmentMinutesSchema.safeParse(
        (stored as Record<string, unknown>)[name]
      );
      return minutes.success && minutes.data !== 0
        ? [[name, minutes.data]]
        : [];
    })
  );
};

/** Where the night that Midnight halves starts and ends. */
export const MIDNIGHT_DEFINITIONS = [
  "sunsetToFajr",
  "sunsetToSunrise",
  "maghribToFajr",
  "maghribToSunrise",
] as const;

export type MidnightDefinition = (typeof MIDNIGHT_DEFINITIONS)[number];
export const DEFAULT_MIDNIGHT_DEFINITION: MidnightDefinition = "sunsetToFajr";
export const midnightDefinitionSchema = z.enum(MIDNIGHT_DEFINITIONS);

/**
 * How Fajr and Isha are found where the sun does not get as deep as their
 * angle, or the night is short: the angle's share of the night (angle ÷ 60),
 * a seventh of the night, or half of it.
 */
export const HIGH_LATITUDE_RULES = [
  "angleBased",
  "oneSeventh",
  "middleOfNight",
] as const;

export type HighLatitudeRule = (typeof HIGH_LATITUDE_RULES)[number];
export const DEFAULT_HIGH_LATITUDE_RULE: HighLatitudeRule = "angleBased";
export const highLatitudeRuleSchema = z.enum(HIGH_LATITUDE_RULES);
/** What a day's Prayer Times depend on, besides the date and time zone. */
export interface PrayerTimesSettings {
  coordinates: Coordinates;
  calculationMethod: CalculationMethod;
  imsakMinutes: number;
  /** The angles of the Custom method; its defaults when left out. */
  customAngles?: CustomAngles;
  /** Minutes added to each Prayer Time as shown; none when left out. */
  adjustments?: PrayerAdjustments;
  /** How Midnight is defined; Sunset to Fajr when left out. */
  midnight?: MidnightDefinition;
  /** How Fajr and Isha are found where the sun never reaches their angle. */
  highLatitudeRule?: HighLatitudeRule;
}

/**
 * Each Prayer Time of one date, in the time zone it was asked for. A time is
 * null where the sun never reaches its angle that day (Fajr and Isha in a
 * high-latitude summer); Midnight and Imsak follow Fajr.
 */
export type PrayerTimes = Record<PrayerTimeName, Temporal.ZonedDateTime | null>;

/**
 * When a twilight Prayer Time falls: when the sun is `angle` degrees below
 * the horizon, or a fixed `minutesAfter` the Prayer Time before it (Maghrib
 * after Sunset, Isha after Maghrib).
 */
export type TwilightRule =
  | { readonly angle: number }
  | { readonly minutesAfter: number };

/** A Calculation Method as data: one record per method, no branches. */
export interface MethodRules {
  readonly fajrAngle: number;
  readonly isha: TwilightRule;
  readonly asrShadowFactor: number;
  /** Degrees below the horizon at Sunset. */
  readonly sunsetAngle: number;
  /** Null when Maghrib is Sunset. */
  readonly maghrib: TwilightRule | null;
}

/** The sun's upper limb touches the horizon, with refraction. */
const HORIZON_ANGLE = 0.833;

/** The rules of the Custom method: Maghrib 0° is Sunset. */
const customRules = ({ fajr, maghrib, isha }: CustomAngles): MethodRules => ({
  fajrAngle: fajr,
  isha: { angle: isha },
  asrShadowFactor: 1,
  sunsetAngle: maghrib === 0 ? HORIZON_ANGLE : 0,
  maghrib: maghrib === 0 ? null : { angle: maghrib },
});

export const METHOD_RULES: Readonly<Record<CalculationMethod, MethodRules>> = {
  jafari: {
    fajrAngle: 18,
    isha: { angle: 17 },
    asrShadowFactor: 1,
    sunsetAngle: 0,
    maghrib: { angle: 4 },
  },
  sunni: {
    fajrAngle: 18,
    isha: { angle: 17 },
    asrShadowFactor: 1,
    sunsetAngle: HORIZON_ANGLE,
    maghrib: null,
  },
  hanafi: {
    fajrAngle: 18,
    isha: { angle: 17 },
    asrShadowFactor: 2,
    sunsetAngle: HORIZON_ANGLE,
    maghrib: null,
  },
  ibadi: {
    fajrAngle: 18,
    isha: { angle: 18 },
    asrShadowFactor: 1,
    sunsetAngle: HORIZON_ANGLE,
    maghrib: null,
  },
  // The Shia methods below set Sunset at 0° and Maghrib when the sun is
  // `angle` below the horizon, like Ja'fari; the Sunni ones are Sunset at
  // 0.833° with Maghrib at Sunset.
  /** Leva Research Institute, Qom: Fajr 16°, Maghrib 4°, Isha 14°. */
  leva: {
    fajrAngle: 16,
    isha: { angle: 14 },
    asrShadowFactor: 1,
    sunsetAngle: 0,
    maghrib: { angle: 4 },
  },
  /** Institute of Geophysics, University of Tehran: 17.7°, 4.5°, 14°. */
  tehran: {
    fajrAngle: 17.7,
    isha: { angle: 14 },
    asrShadowFactor: 1,
    sunsetAngle: 0,
    maghrib: { angle: 4.5 },
  },
  /** Ithna-Ashari as other prayer apps give it: 18°, 4°, 14°. */
  ithnaAshari: {
    fajrAngle: 18,
    isha: { angle: 14 },
    asrShadowFactor: 1,
    sunsetAngle: 0,
    maghrib: { angle: 4 },
  },
  /** The Al-Hadi calendar of Bahrain: 18°, 4°, Isha 75 minutes after Maghrib. */
  alHadiBahrain: {
    fajrAngle: 18,
    isha: { minutesAfter: 75 },
    asrShadowFactor: 1,
    sunsetAngle: 0,
    maghrib: { angle: 4 },
  },
  /** Muslim World League: Fajr 18°, Isha 17°. */
  mwl: {
    fajrAngle: 18,
    isha: { angle: 17 },
    asrShadowFactor: 1,
    sunsetAngle: HORIZON_ANGLE,
    maghrib: null,
  },
  /** Islamic Society of North America: 15° and 15°. */
  isna: {
    fajrAngle: 15,
    isha: { angle: 15 },
    asrShadowFactor: 1,
    sunsetAngle: HORIZON_ANGLE,
    maghrib: null,
  },
  /** Egyptian General Authority of Survey: 19.5° and 17.5°. */
  egypt: {
    fajrAngle: 19.5,
    isha: { angle: 17.5 },
    asrShadowFactor: 1,
    sunsetAngle: HORIZON_ANGLE,
    maghrib: null,
  },
  /** University of Islamic Sciences, Karachi: 18° and 18°. */
  karachi: {
    fajrAngle: 18,
    isha: { angle: 18 },
    asrShadowFactor: 1,
    sunsetAngle: HORIZON_ANGLE,
    maghrib: null,
  },
  /** Umm al-Qura University, Makkah: Fajr 18.5°, Isha 90 minutes after Maghrib. */
  ummAlQura: {
    fajrAngle: 18.5,
    isha: { minutesAfter: 90 },
    asrShadowFactor: 1,
    sunsetAngle: HORIZON_ANGLE,
    maghrib: null,
  },
  /** The Believer's own angles replace these (see `methodRules`). */
  custom: customRules(DEFAULT_CUSTOM_ANGLES),
};

/** The rules a place's Prayer Times follow: the method's, or the Custom angles. */
export const methodRules = ({
  calculationMethod,
  customAngles,
}: Pick<
  PrayerTimesSettings,
  "calculationMethod" | "customAngles"
>): MethodRules =>
  calculationMethod === "custom"
    ? customRules(customAngles ?? DEFAULT_CUSTOM_ANGLES)
    : METHOD_RULES[calculationMethod];

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

const roundToMinute = (instant: Temporal.Instant) =>
  instant.round({ smallestUnit: "minute", roundingMode: "halfExpand" });

const instantBetween = (
  start: Temporal.Instant,
  end: Temporal.Instant,
  fraction: number
) =>
  roundToMinute(
    Temporal.Instant.fromEpochMilliseconds(
      Math.round(
        start.epochMilliseconds +
          (end.epochMilliseconds - start.epochMilliseconds) * fraction
      )
    )
  );

/** The share of the night a twilight Prayer Time keeps from Sunset or Sunrise. */
const nightShare = (rule: HighLatitudeRule, angle: number): number => {
  switch (rule) {
    case "angleBased": {
      return angle / 60;
    }
    case "oneSeventh": {
      return 1 / 7;
    }
    case "middleOfNight": {
      return 1 / 2;
    }
    default: {
      return rule satisfies never;
    }
  }
};

/**
 * The physical night around a date: the sunrise of the date and the sunset
 * before it (`nightBefore`) or the sunset of the date and the sunrise after
 * it (`nightAfter`), on the true horizon whatever the method's Sunset.
 */
const horizonSun = (date: Temporal.PlainDate, coordinates: Coordinates) => {
  const day = solarDay(date, coordinates);
  return {
    sunrise: day.toInstant(
      day.sunAngleTime(HORIZON_ANGLE, FIRST_GUESS.sunrise, true)
    ),
    sunset: day.toInstant(
      day.sunAngleTime(HORIZON_ANGLE, FIRST_GUESS.sunset, false)
    ),
  };
};

/**
 * Fajr of `date`: the sun's own time at the method's angle, unless the sun
 * never gets that deep or Fajr would fall further from Sunrise than the
 * high-latitude rule allows; then it is that share of the night before Sunrise.
 */
const fajrInstant = (
  date: Temporal.PlainDate,
  settings: PrayerTimesSettings
): Temporal.Instant | null => {
  const day = solarDay(date, settings.coordinates);
  const { fajrAngle } = methodRules(settings);
  const sun = day.toInstant(
    day.sunAngleTime(fajrAngle, FIRST_GUESS.fajr, true)
  );
  const { sunrise } = horizonSun(date, settings.coordinates);
  const { sunset: previousSunset } = horizonSun(
    date.subtract({ days: 1 }),
    settings.coordinates
  );
  if (!(sunrise && previousSunset)) {
    return sun;
  }
  const portion =
    (sunrise.epochMilliseconds - previousSunset.epochMilliseconds) *
    nightShare(
      settings.highLatitudeRule ?? DEFAULT_HIGH_LATITUDE_RULE,
      fajrAngle
    );
  return !sun || sunrise.epochMilliseconds - sun.epochMilliseconds > portion
    ? roundToMinute(
        Temporal.Instant.fromEpochMilliseconds(
          Math.round(sunrise.epochMilliseconds - portion)
        )
      )
    : sun;
};

/**
 * Isha of `date` after an angle: as Fajr, a share of the night after Sunset
 * at most. Isha a fixed number of minutes after Maghrib is never changed.
 */
const ishaAtAngle = (
  date: Temporal.PlainDate,
  settings: PrayerTimesSettings,
  angle: number
): Temporal.Instant | null => {
  const day = solarDay(date, settings.coordinates);
  const sun = day.toInstant(day.sunAngleTime(angle, FIRST_GUESS.sunset, false));
  const { sunset } = horizonSun(date, settings.coordinates);
  const { sunrise: nextSunrise } = horizonSun(
    date.add({ days: 1 }),
    settings.coordinates
  );
  if (!(sunset && nextSunrise)) {
    return sun;
  }
  const portion =
    (nextSunrise.epochMilliseconds - sunset.epochMilliseconds) *
    nightShare(settings.highLatitudeRule ?? DEFAULT_HIGH_LATITUDE_RULE, angle);
  return !sun || sun.epochMilliseconds - sunset.epochMilliseconds > portion
    ? roundToMinute(
        Temporal.Instant.fromEpochMilliseconds(
          Math.round(sunset.epochMilliseconds + portion)
        )
      )
    : sun;
};

/**
 * The Prayer Times of `date` at the settings' place, in `timeZone` (IANA):
 * the place's own zone, from `locationTimeZone`, never the device's.
 *
 * Times are found from the sun first. Each Believer adjustment is then added
 * once, as minutes on the instant, to the time as shown, so it keeps its sign
 * across a daylight-saving change and does not move the other times.
 */
export const calculatePrayerTimes = (
  date: Temporal.PlainDate,
  timeZone: string,
  settings: PrayerTimesSettings
): PrayerTimes => {
  const rules = methodRules(settings);
  const day = solarDay(date, settings.coordinates);

  const fajr = fajrInstant(date, settings);
  const sunrise = day.toInstant(
    day.sunAngleTime(HORIZON_ANGLE, FIRST_GUESS.sunrise, true)
  );
  const sunset = day.toInstant(
    day.sunAngleTime(rules.sunsetAngle, FIRST_GUESS.sunset, false)
  );
  // At high latitudes the sun may never reach the Maghrib angle.
  const maghrib =
    (rules.maghrib &&
      ("angle" in rules.maghrib
        ? day.toInstant(
            day.sunAngleTime(rules.maghrib.angle, FIRST_GUESS.sunset, false)
          )
        : (sunset?.add({ minutes: rules.maghrib.minutesAfter }) ?? null))) ??
    sunset;
  const isha =
    "angle" in rules.isha
      ? ishaAtAngle(date, settings, rules.isha.angle)
      : (maghrib?.add({ minutes: rules.isha.minutesAfter }) ?? null);

  const definition = settings.midnight ?? DEFAULT_MIDNIGHT_DEFINITION;
  const nightStart = definition.startsWith("sunset") ? sunset : maghrib;
  const nightEnd = definition.endsWith("Fajr")
    ? fajrInstant(date.add({ days: 1 }), settings)
    : horizonSun(date.add({ days: 1 }), settings.coordinates).sunrise;
  const midnight =
    nightStart && nightEnd ? instantBetween(nightStart, nightEnd, 1 / 2) : null;

  const shown = (name: PrayerTimeName, instant: Temporal.Instant | null) =>
    instant
      ?.add({ minutes: settings.adjustments?.[name] ?? 0 })
      .toZonedDateTimeISO(timeZone) ?? null;

  return {
    imsak: shown(
      "imsak",
      fajr?.subtract({ minutes: settings.imsakMinutes }) ?? null
    ),
    fajr: shown("fajr", fajr),
    sunrise: shown("sunrise", sunrise),
    dhuhr: shown(
      "dhuhr",
      day
        .toInstant(day.noonAt(FIRST_GUESS.noon))
        ?.add({ minutes: DHUHR_AFTER_NOON_MINUTES }) ?? null
    ),
    asr: shown(
      "asr",
      day.toInstant(day.asrTime(rules.asrShadowFactor, FIRST_GUESS.asr))
    ),
    sunset: shown("sunset", sunset),
    maghrib: shown("maghrib", maghrib),
    isha: shown("isha", isha),
    midnight: shown("midnight", midnight),
  };
};

export interface PrayerTimeAt {
  name: PrayerTimeName;
  at: Temporal.ZonedDateTime;
}

/**
 * The visible Prayer Times around `now`, from yesterday to tomorrow at the
 * settings' place, on its clock, in order. Yesterday is included because its
 * Midnight can fall after 00:00.
 */
const visibleAround = (
  now: Temporal.Instant,
  settings: PrayerTimesSettings,
  hidden: readonly PrayerTimeName[]
): PrayerTimeAt[] => {
  const timeZone = locationTimeZone(settings.coordinates);
  const today = now.toZonedDateTimeISO(timeZone).toPlainDate();
  return [today.subtract({ days: 1 }), today, today.add({ days: 1 })]
    .flatMap((date) => {
      const times = calculatePrayerTimes(date, timeZone, settings);
      return PRAYER_TIMES.filter((name) => !hidden.includes(name)).flatMap(
        (name) => {
          const at = times[name];
          return at ? [{ name, at }] : [];
        }
      );
    })
    .toSorted((a, b) => Temporal.ZonedDateTime.compare(a.at, b.at));
};

/** The next visible Prayer Time after `now`, on the place's own clock. */
export const nextPrayerTime = (
  now: Temporal.Instant,
  settings: PrayerTimesSettings,
  hidden: readonly PrayerTimeName[]
): PrayerTimeAt | null =>
  visibleAround(now, settings, hidden).find(
    ({ at }) => Temporal.Instant.compare(at.toInstant(), now) > 0
  ) ?? null;

/**
 * The latest visible Prayer Time that has begun by `now`, on the place's own
 * clock.
 */
export const currentPrayerTime = (
  now: Temporal.Instant,
  settings: PrayerTimesSettings,
  hidden: readonly PrayerTimeName[]
): PrayerTimeAt | null =>
  visibleAround(now, settings, hidden).findLast(
    ({ at }) => Temporal.Instant.compare(at.toInstant(), now) <= 0
  ) ?? null;
