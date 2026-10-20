import { Temporal } from "temporal-polyfill";
import { describe, expect, it } from "vitest";

import {
  calculatePrayerTimes,
  DEFAULT_HIDDEN_PRAYER_TIMES,
  MIDNIGHT_DEFINITIONS,
  readPrayerAdjustments,
  prayerAdjustmentsSchema,
} from "./prayer-times";
import type {
  HighLatitudeRule,
  MidnightDefinition,
  PrayerTimes,
  PrayerTimesSettings,
} from "./prayer-times";
import { isHighLatitude, prayerTimesSanity } from "./prayer-times-sanity";

// High-latitude references come from api.aladhan.com for Ja'fari angles
// (method=99&methodSettings=18,4,17), Dhuhr tuned +1 minute, and its
// latitudeAdjustmentMethod: 1 middle of the night, 2 one seventh, 3 angle
// based, for example:
// /v1/timings/21-06-2025?latitude=51.5074&longitude=-0.1278
//   &timezonestring=Europe/London&method=99&methodSettings=18,4,17
//   &school=0&tune=0,0,0,1,0,0,0,0,0&latitudeAdjustmentMethod=3

const LONDON = { latitude: 51.5074, longitude: -0.1278 };
const REYKJAVIK = { latitude: 64.1466, longitude: -21.9426 };
const LONGYEARBYEN = { latitude: 78.2232, longitude: 15.6267 };
const LONDON_ZONE = "Europe/London";

const timesAt = (
  date: string,
  timeZone: string,
  settings: Partial<PrayerTimesSettings> &
    Pick<PrayerTimesSettings, "coordinates">
): PrayerTimes =>
  calculatePrayerTimes(Temporal.PlainDate.from(date), timeZone, {
    calculationMethod: "jafari",
    imsakMinutes: 10,
    ...settings,
  });

const london = (
  date: string,
  settings: Partial<PrayerTimesSettings> = {}
): PrayerTimes =>
  timesAt(date, LONDON_ZONE, { coordinates: LONDON, ...settings });

const minutesApart = (
  got: Temporal.ZonedDateTime | null,
  wanted: string,
  timeZone: string
) =>
  got
    ? Math.abs(
        got
          .since(Temporal.PlainDateTime.from(wanted).toZonedDateTime(timeZone))
          .total("minutes")
      )
    : Number.POSITIVE_INFINITY;

const MINUTE_TOLERANCE = 1;

describe("the high-latitude rules in London on 21 June", () => {
  const REFERENCE: Record<
    HighLatitudeRule,
    { fajr: string; isha: string; imsak: string }
  > = {
    angleBased: {
      imsak: "2025-06-21T02:21",
      fajr: "2025-06-21T02:31",
      isha: "2025-06-21T23:27",
    },
    oneSeventh: {
      imsak: "2025-06-21T03:30",
      fajr: "2025-06-21T03:40",
      isha: "2025-06-21T22:25",
    },
    middleOfNight: {
      imsak: "2025-06-21T00:52",
      fajr: "2025-06-21T01:02",
      isha: "2025-06-22T01:02",
    },
  };

  it.each(Object.entries(REFERENCE))(
    "gives Fajr, Imsak and Isha by the %s rule",
    (rule, reference) => {
      const times = london("2025-06-21", {
        highLatitudeRule: rule as HighLatitudeRule,
      });

      expect({
        fajr: minutesApart(times.fajr, reference.fajr, LONDON_ZONE),
        imsak: minutesApart(times.imsak, reference.imsak, LONDON_ZONE),
        isha: minutesApart(times.isha, reference.isha, LONDON_ZONE),
      }).toStrictEqual({
        fajr: expect.toSatisfy((m: number) => m <= MINUTE_TOLERANCE),
        imsak: expect.toSatisfy((m: number) => m <= MINUTE_TOLERANCE),
        isha: expect.toSatisfy((m: number) => m <= MINUTE_TOLERANCE),
      });
    }
  );

  it("uses the angle-based rule unless told otherwise", () => {
    expect(london("2025-06-21")).toStrictEqual(
      london("2025-06-21", { highLatitudeRule: "angleBased" })
    );
  });

  it("defines every Prayer Time under each rule", () => {
    for (const rule of ["angleBased", "oneSeventh", "middleOfNight"] as const) {
      const times = london("2025-06-21", { highLatitudeRule: rule });

      expect(Object.values(times).every((time) => time !== null)).toBeTruthy();
    }
  });

  it("keeps Fajr at the sun's own time where its angle is reached", () => {
    const winter = london("2025-12-21");

    expect(
      minutesApart(winter.fajr, "2025-12-21T05:59", LONDON_ZONE)
    ).toBeLessThanOrEqual(MINUTE_TOLERANCE);
    expect(
      london("2025-12-21", { highLatitudeRule: "oneSeventh" }).fajr
    ).toStrictEqual(winter.fajr);
  });

  it("gives Reykjavik a Fajr and Isha in June by the angle-based rule", () => {
    const times = timesAt("2025-06-21", "Atlantic/Reykjavik", {
      coordinates: REYKJAVIK,
    });

    expect(
      minutesApart(times.fajr, "2025-06-21T02:04", "Atlantic/Reykjavik")
    ).toBeLessThanOrEqual(MINUTE_TOLERANCE);
    expect(
      minutesApart(times.isha, "2025-06-22T00:53", "Atlantic/Reykjavik")
    ).toBeLessThanOrEqual(MINUTE_TOLERANCE);
  });

  it("leaves an Isha a number of minutes after Maghrib as it is", () => {
    const times = london("2025-06-21", {
      calculationMethod: "ummAlQura",
      highLatitudeRule: "middleOfNight",
    });

    expect(
      times.isha?.since(times.maghrib ?? times.isha).total("minutes")
    ).toBe(90);
  });
});

const minutesBetween = (
  start: Temporal.ZonedDateTime | null,
  end: Temporal.ZonedDateTime | null
) => (start && end ? end.since(start).total("minutes") : Number.NaN);

describe("the Midnight definitions", () => {
  const today = london("2025-12-21");
  const tomorrow = london("2025-12-22");
  const midnightOf = (definition: MidnightDefinition) =>
    london("2025-12-21", { midnight: definition }).midnight;

  const NIGHTS: Record<
    MidnightDefinition,
    [Temporal.ZonedDateTime | null, Temporal.ZonedDateTime | null]
  > = {
    sunsetToFajr: [today.sunset, tomorrow.fajr],
    sunsetToSunrise: [today.sunset, tomorrow.sunrise],
    maghribToFajr: [today.maghrib, tomorrow.fajr],
    maghribToSunrise: [today.maghrib, tomorrow.sunrise],
  };

  it.each(MIDNIGHT_DEFINITIONS)("halves the night of %s", (definition) => {
    const [start, end] = NIGHTS[definition];
    const night = minutesBetween(start, end);

    expect(
      Math.abs(minutesBetween(start, midnightOf(definition)) - night / 2)
    ).toBeLessThanOrEqual(MINUTE_TOLERANCE);
  });

  it("defaults to Sunset to Fajr, as before", () => {
    expect(london("2025-12-21").midnight).toStrictEqual(
      midnightOf("sunsetToFajr")
    );
  });

  it("puts each definition at a different time", () => {
    const minutes = new Set(
      MIDNIGHT_DEFINITIONS.map(
        (definition) => midnightOf(definition)?.epochMilliseconds
      )
    );

    expect(minutes.size).toBe(MIDNIGHT_DEFINITIONS.length);
  });
});

describe("adjustments", () => {
  it("adds the minutes to the Prayer Time and to no other", () => {
    const plain = london("2025-12-21");
    const adjusted = london("2025-12-21", {
      adjustments: { fajr: 5, maghrib: -3 },
    });

    expect(
      adjusted.fajr?.since(plain.fajr ?? adjusted.fajr).total("minutes")
    ).toBe(5);
    expect(
      adjusted.maghrib
        ?.since(plain.maghrib ?? adjusted.maghrib)
        .total("minutes")
    ).toBe(-3);
    expect(adjusted.dhuhr).toStrictEqual(plain.dhuhr);
    expect(adjusted.isha).toStrictEqual(plain.isha);
    expect(adjusted.midnight).toStrictEqual(plain.midnight);
  });

  it("applies the extremes of 30 and -30 minutes", () => {
    const plain = london("2025-12-21");

    for (const minutes of [30, -30]) {
      const adjusted = london("2025-12-21", {
        adjustments: { dhuhr: minutes },
      });

      expect(
        adjusted.dhuhr?.since(plain.dhuhr ?? adjusted.dhuhr).total("minutes")
      ).toBe(minutes);
    }
  });

  it("keeps its sign and size on the days the clocks change", () => {
    for (const date of [
      "2025-03-29",
      "2025-03-30",
      "2025-10-25",
      "2025-10-26",
    ]) {
      const plain = london(date);
      for (const minutes of [-20, 20]) {
        const adjusted = london(date, { adjustments: { midnight: minutes } });

        expect(
          adjusted.midnight
            ?.since(plain.midnight ?? adjusted.midnight)
            .total("minutes")
        ).toBe(minutes);
      }
    }
  });

  it("counts the minutes across the hour the clocks skip", () => {
    // Midnight of 29 March is just before 01:00 UTC on the 30th, when the
    // clocks go forward; 120 minutes later is an hour on the wall clock more.
    const plain = london("2025-03-29");
    const adjusted = london("2025-03-29", { adjustments: { midnight: 120 } });

    expect(
      adjusted.midnight
        ?.since(plain.midnight ?? adjusted.midnight)
        .total("minutes")
    ).toBe(120);
    expect(adjusted.midnight?.offset).not.toBe(plain.midnight?.offset);
  });

  it("moves Isha after Maghrib from the unadjusted Maghrib", () => {
    const plain = london("2025-12-21", { calculationMethod: "ummAlQura" });
    const adjusted = london("2025-12-21", {
      calculationMethod: "ummAlQura",
      adjustments: { maghrib: 10 },
    });

    expect(adjusted.isha).toStrictEqual(plain.isha);
  });
});

describe(readPrayerAdjustments, () => {
  it("keeps valid minutes and drops the rest", () => {
    expect(
      readPrayerAdjustments({
        fajr: 4,
        isha: 31,
        asr: 0,
        maghrib: 1.5,
        sunrise: "3",
        nothing: 5,
      })
    ).toStrictEqual({ fajr: 4 });
  });

  it("reads anything else as no adjustments", () => {
    expect(readPrayerAdjustments(null)).toStrictEqual({});
    expect(readPrayerAdjustments("fajr")).toStrictEqual({});
  });

  it("rejects a change beyond 30 minutes", () => {
    expect(
      prayerAdjustmentsSchema.safeParse({ fajr: 30 }).success
    ).toBeTruthy();
    expect(
      prayerAdjustmentsSchema.safeParse({ fajr: -31 }).success
    ).toBeFalsy();
    expect(
      prayerAdjustmentsSchema.safeParse({ fajr: 0.5 }).success
    ).toBeFalsy();
  });
});

describe(prayerTimesSanity, () => {
  const MIDSUMMER_POLAR = timesAt("2025-06-21", "Arctic/Longyearbyen", {
    coordinates: LONGYEARBYEN,
  });

  it("finds nothing wrong with an ordinary day", () => {
    expect(prayerTimesSanity(london("2025-12-21"))).toStrictEqual([]);
  });

  it("finds nothing wrong with London in June under the default rule", () => {
    expect(prayerTimesSanity(london("2025-06-21"))).toStrictEqual([]);
  });

  it("reports a Prayer Time that could not be calculated", () => {
    expect(prayerTimesSanity(MIDSUMMER_POLAR)).toContainEqual({
      kind: "undefined",
      name: "sunset",
    });
  });

  it("does not report a hidden Prayer Time", () => {
    const problems = prayerTimesSanity(MIDSUMMER_POLAR, [
      ...DEFAULT_HIDDEN_PRAYER_TIMES,
      "midnight",
      "maghrib",
      "sunrise",
      "fajr",
    ]);

    expect(problems.filter(({ name }) => name === "sunset")).toStrictEqual([]);
  });

  it("reports a Prayer Time that falls before the one before it", () => {
    const times = london("2025-12-21", {
      adjustments: { sunset: 30, maghrib: -30 },
    });

    expect(prayerTimesSanity(times, [])).toStrictEqual([
      { kind: "outOfOrder", name: "maghrib", before: "sunset" },
    ]);
  });

  it("reports Isha that falls after Midnight, as it can with Sunset to Fajr", () => {
    const problems = prayerTimesSanity(
      london("2025-06-21", { highLatitudeRule: "middleOfNight" }),
      []
    );

    expect(problems).toStrictEqual([
      { kind: "outOfOrder", name: "midnight", before: "isha" },
    ]);
  });
});

describe(isHighLatitude, () => {
  it.each([
    [51.5074, true],
    [-54.8, true],
    [64.1466, true],
    [48.5, true],
    [48.4, false],
    [33.3152, false],
    [0, false],
  ])("is %s° high: %s", (latitude, high) => {
    expect(isHighLatitude(latitude)).toBe(high);
  });
});
