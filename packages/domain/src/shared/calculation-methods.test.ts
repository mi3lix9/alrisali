import { Temporal } from "temporal-polyfill";
import { describe, expect, it } from "vitest";

import {
  CALCULATION_METHOD_GROUPS,
  CALCULATION_METHODS,
  customAnglesSchema,
  DEFAULT_CALCULATION_METHOD,
  DEFAULT_CUSTOM_ANGLES,
} from "./calculation-method";
import type { CalculationMethod, CustomAngles } from "./calculation-method";
import {
  calculatePrayerTimes,
  METHOD_RULES,
  methodRules,
} from "./prayer-times";
import type { Coordinates, PrayerTimes } from "./prayer-times";

// Reference times come from api.aladhan.com (an independent implementation),
// asked for each method and Asr school 0, Dhuhr tuned +1 minute and no
// high-latitude adjustment, for example:
// /v1/timings/21-06-2025?latitude=26.5652&longitude=50.0124
//   &timezonestring=Asia/Riyadh&method=7&school=0
//   &tune=0,0,0,1,0,0,0,0,0&latitudeAdjustmentMethod=0
// Methods aladhan has no id for use method=99 with methodSettings:
//   Ithna-Ashari 18,4,14 and Al-Hadi Bahrain 18,4,75 min.
// Aladhan's Sunni "Maghrib" is Sunset at 0.833°; for the Shia methods it is
// the 4° or 4.5° Maghrib. Where the sun never gets as deep as a method's
// angle (London in June) aladhan falls back to a night portion; we have no
// high-latitude rule here (ticket 03), so those times are null.

const PLACES = {
  qatif: { latitude: 26.5652, longitude: 50.0124, zone: "Asia/Riyadh" },
  baghdad: { latitude: 33.3152, longitude: 44.3661, zone: "Asia/Baghdad" },
  qom: { latitude: 34.6416, longitude: 50.8746, zone: "Asia/Tehran" },
  london: { latitude: 51.5074, longitude: -0.1278, zone: "Europe/London" },
} satisfies Record<string, Coordinates & { zone: string }>;

type Place = keyof typeof PLACES;
type Day = `${Place} ${"2025-06-21" | "2025-12-21"}`;
type Reference = Record<
  Day,
  { fajr: string | null; maghrib: string; isha: string | null }
>;

/** Times that do not depend on the method. */
const COMMON: Record<Day, { sunrise: string; dhuhr: string; asr: string }> = {
  "qatif 2025-06-21": { sunrise: "04:48", dhuhr: "11:43", asr: "15:08" },
  "qatif 2025-12-21": { sunrise: "06:24", dhuhr: "11:39", asr: "14:33" },
  "baghdad 2025-06-21": { sunrise: "04:54", dhuhr: "12:05", asr: "15:48" },
  "baghdad 2025-12-21": { sunrise: "07:02", dhuhr: "12:02", asr: "14:41" },
  "qom 2025-06-21": { sunrise: "04:54", dhuhr: "12:09", asr: "15:55" },
  "qom 2025-12-21": { sunrise: "07:10", dhuhr: "12:06", asr: "14:42" },
  "london 2025-06-21": { sunrise: "04:43", dhuhr: "13:03", asr: "17:25" },
  "london 2025-12-21": { sunrise: "08:04", dhuhr: "12:00", asr: "13:38" },
};

const REFERENCE: Record<
  Exclude<
    CalculationMethod,
    "jafari" | "sunni" | "hanafi" | "ibadi" | "custom"
  >,
  Reference
> = {
  leva: {
    "qatif 2025-06-21": { fajr: "03:28", maghrib: "18:52", isha: "19:45" },
    "qatif 2025-12-21": { fajr: "05:11", maghrib: "17:08", isha: "17:56" },
    "baghdad 2025-06-21": { fajr: "03:24", maghrib: "19:33", isha: "20:32" },
    "baghdad 2025-12-21": { fajr: "05:43", maghrib: "17:16", isha: "18:08" },
    "qom 2025-06-21": { fajr: "03:22", maghrib: "19:41", isha: "20:42" },
    "qom 2025-12-21": { fajr: "05:49", maghrib: "17:17", isha: "18:10" },
    "london 2025-06-21": { fajr: null, maghrib: "21:50", isha: "00:05" },
    "london 2025-12-21": { fajr: "06:13", maghrib: "16:19", isha: "17:31" },
  },
  tehran: {
    "qatif 2025-06-21": { fajr: "03:18", maghrib: "18:55", isha: "19:45" },
    "qatif 2025-12-21": { fajr: "05:03", maghrib: "17:10", isha: "17:56" },
    "baghdad 2025-06-21": { fajr: "03:12", maghrib: "19:36", isha: "20:32" },
    "baghdad 2025-12-21": { fajr: "05:35", maghrib: "17:19", isha: "18:08" },
    "qom 2025-06-21": { fajr: "03:10", maghrib: "19:44", isha: "20:42" },
    "qom 2025-12-21": { fajr: "05:41", maghrib: "17:20", isha: "18:10" },
    "london 2025-06-21": { fajr: null, maghrib: "21:55", isha: "00:05" },
    "london 2025-12-21": { fajr: "06:01", maghrib: "16:23", isha: "17:31" },
  },
  ithnaAshari: {
    "qatif 2025-06-21": { fajr: "03:16", maghrib: "18:52", isha: "19:45" },
    "qatif 2025-12-21": { fajr: "05:01", maghrib: "17:08", isha: "17:56" },
    "baghdad 2025-06-21": { fajr: "03:10", maghrib: "19:33", isha: "20:32" },
    "baghdad 2025-12-21": { fajr: "05:33", maghrib: "17:16", isha: "18:08" },
    "qom 2025-06-21": { fajr: "03:08", maghrib: "19:41", isha: "20:42" },
    "qom 2025-12-21": { fajr: "05:39", maghrib: "17:17", isha: "18:10" },
    "london 2025-06-21": { fajr: null, maghrib: "21:50", isha: "00:05" },
    "london 2025-12-21": { fajr: "05:59", maghrib: "16:19", isha: "17:31" },
  },
  alHadiBahrain: {
    "qatif 2025-06-21": { fajr: "03:16", maghrib: "18:52", isha: "20:07" },
    "qatif 2025-12-21": { fajr: "05:01", maghrib: "17:08", isha: "18:23" },
    "baghdad 2025-06-21": { fajr: "03:10", maghrib: "19:33", isha: "20:48" },
    "baghdad 2025-12-21": { fajr: "05:33", maghrib: "17:16", isha: "18:31" },
    "qom 2025-06-21": { fajr: "03:08", maghrib: "19:41", isha: "20:56" },
    "qom 2025-12-21": { fajr: "05:39", maghrib: "17:17", isha: "18:32" },
    "london 2025-06-21": { fajr: null, maghrib: "21:50", isha: "23:05" },
    "london 2025-12-21": { fajr: "05:59", maghrib: "16:19", isha: "17:34" },
  },
  mwl: {
    "qatif 2025-06-21": { fajr: "03:16", maghrib: "18:36", isha: "20:02" },
    "qatif 2025-12-21": { fajr: "05:01", maghrib: "16:52", isha: "18:10" },
    "baghdad 2025-06-21": { fajr: "03:10", maghrib: "19:15", isha: "20:52" },
    "baghdad 2025-12-21": { fajr: "05:33", maghrib: "16:59", isha: "18:23" },
    "qom 2025-06-21": { fajr: "03:08", maghrib: "19:23", isha: "21:02" },
    "qom 2025-12-21": { fajr: "05:39", maghrib: "17:00", isha: "18:25" },
    "london 2025-06-21": { fajr: null, maghrib: "21:22", isha: null },
    "london 2025-12-21": { fajr: "05:59", maghrib: "15:54", isha: "17:51" },
  },
  isna: {
    "qatif 2025-06-21": { fajr: "03:33", maghrib: "18:36", isha: "19:50" },
    "qatif 2025-12-21": { fajr: "05:15", maghrib: "16:52", isha: "18:01" },
    "baghdad 2025-06-21": { fajr: "03:30", maghrib: "19:15", isha: "20:38" },
    "baghdad 2025-12-21": { fajr: "05:48", maghrib: "16:59", isha: "18:13" },
    "qom 2025-06-21": { fajr: "03:28", maghrib: "19:23", isha: "20:48" },
    "qom 2025-12-21": { fajr: "05:55", maghrib: "17:00", isha: "18:15" },
    "london 2025-06-21": { fajr: "01:16", maghrib: "21:22", isha: "00:49" },
    "london 2025-12-21": { fajr: "06:20", maghrib: "15:54", isha: "17:38" },
  },
  egypt: {
    "qatif 2025-06-21": { fajr: "03:07", maghrib: "18:36", isha: "20:05" },
    "qatif 2025-12-21": { fajr: "04:54", maghrib: "16:52", isha: "18:13" },
    "baghdad 2025-06-21": { fajr: "03:00", maghrib: "19:15", isha: "20:55" },
    "baghdad 2025-12-21": { fajr: "05:26", maghrib: "16:59", isha: "18:25" },
    "qom 2025-06-21": { fajr: "02:57", maghrib: "19:23", isha: "21:05" },
    "qom 2025-12-21": { fajr: "05:32", maghrib: "17:00", isha: "18:27" },
    "london 2025-06-21": { fajr: null, maghrib: "21:22", isha: null },
    "london 2025-12-21": { fajr: "05:50", maghrib: "15:54", isha: "17:55" },
  },
  karachi: {
    "qatif 2025-06-21": { fajr: "03:16", maghrib: "18:36", isha: "20:07" },
    "qatif 2025-12-21": { fajr: "05:01", maghrib: "16:52", isha: "18:15" },
    "baghdad 2025-06-21": { fajr: "03:10", maghrib: "19:15", isha: "20:58" },
    "baghdad 2025-12-21": { fajr: "05:33", maghrib: "16:59", isha: "18:28" },
    "qom 2025-06-21": { fajr: "03:08", maghrib: "19:23", isha: "21:09" },
    "qom 2025-12-21": { fajr: "05:39", maghrib: "17:00", isha: "18:30" },
    "london 2025-06-21": { fajr: null, maghrib: "21:22", isha: null },
    "london 2025-12-21": { fajr: "05:59", maghrib: "15:54", isha: "17:58" },
  },
  ummAlQura: {
    "qatif 2025-06-21": { fajr: "03:13", maghrib: "18:36", isha: "20:06" },
    "qatif 2025-12-21": { fajr: "04:59", maghrib: "16:52", isha: "18:22" },
    "baghdad 2025-06-21": { fajr: "03:07", maghrib: "19:15", isha: "20:45" },
    "baghdad 2025-12-21": { fajr: "05:31", maghrib: "16:59", isha: "18:29" },
    "qom 2025-06-21": { fajr: "03:04", maghrib: "19:23", isha: "20:53" },
    "qom 2025-12-21": { fajr: "05:37", maghrib: "17:00", isha: "18:30" },
    "london 2025-06-21": { fajr: null, maghrib: "21:22", isha: "22:52" },
    "london 2025-12-21": { fajr: "05:56", maghrib: "15:54", isha: "17:24" },
  },
};

const MINUTE_TOLERANCE = 1;

const timesOf = (
  place: Place,
  date: string,
  calculationMethod: CalculationMethod
) =>
  calculatePrayerTimes(Temporal.PlainDate.from(date), PLACES[place].zone, {
    coordinates: PLACES[place],
    calculationMethod,
    imsakMinutes: 10,
  });

/** "name got vs wanted" for each time more than a minute from its reference. */
const mismatches = (
  place: Place,
  date: string,
  method: CalculationMethod,
  expected: Record<string, string | null>
): string[] => {
  const times = timesOf(place, date, method);
  const after = (previous: string | null, time: string) =>
    previous !== null && time < previous
      ? Temporal.PlainDate.from(date).add({ days: 1 }).toString()
      : date;
  let previous: string | null = null;
  return Object.entries(expected).flatMap(([name, want]) => {
    const got = times[name as keyof typeof times];
    if (want === null || got === null) {
      return want === null && got === null
        ? []
        : [`${name} ${got?.toPlainTime().toString() ?? null} vs ${want}`];
    }
    const wanted = Temporal.PlainDateTime.from(
      `${after(previous, want)}T${want}`
    ).toZonedDateTime(PLACES[place].zone);
    previous = want;
    return Math.abs(got.since(wanted).total("minutes")) <= MINUTE_TOLERANCE
      ? []
      : [`${name} ${got.toPlainTime().toString()} vs ${want}`];
  });
};

const REFERENCE_CASES = Object.entries(REFERENCE).flatMap(([method, days]) =>
  Object.entries(days).map(([day, reference]) => ({
    method: method as CalculationMethod,
    day: day as Day,
    reference,
  }))
);

describe("the new Calculation Methods against reference times", () => {
  it.each(REFERENCE_CASES)(
    "gives $method times for $day",
    ({ method, day, reference }) => {
      const [place, date] = day.split(" ") as [Place, string];
      const { sunrise, dhuhr, asr } = COMMON[day];
      expect(
        mismatches(place, date, method, {
          fajr: reference.fajr,
          sunrise,
          dhuhr,
          asr,
          maghrib: reference.maghrib,
          isha: reference.isha,
        })
      ).toStrictEqual([]);
    }
  );
});

const minutesBetweenMaghribAndIsha = (times: PrayerTimes) =>
  times.isha?.since(times.maghrib ?? times.isha).total("minutes");

describe("an Isha that falls a number of minutes after Maghrib", () => {
  it("is Maghrib plus 90 minutes for Umm al-Qura, from Sunset", () => {
    const times = timesOf("qatif", "2025-06-21", "ummAlQura");
    expect(minutesBetweenMaghribAndIsha(times)).toBe(90);
    expect(times.maghrib?.toString()).toBe(times.sunset?.toString());
  });

  it("is Maghrib plus 75 minutes for Al-Hadi Bahrain, from the 4° Maghrib", () => {
    const times = timesOf("baghdad", "2025-12-21", "alHadiBahrain");
    expect(minutesBetweenMaghribAndIsha(times)).toBe(75);
    expect(
      times.maghrib?.since(times.sunset ?? times.maghrib).total("minutes")
    ).toBeGreaterThan(10);
  });

  it("stays 90 minutes after Maghrib on the day the clocks go forward", () => {
    const times = calculatePrayerTimes(
      Temporal.PlainDate.from("2025-03-30"),
      "Europe/London",
      {
        coordinates: PLACES.london,
        calculationMethod: "ummAlQura",
        imsakMinutes: 10,
      }
    );
    expect(minutesBetweenMaghribAndIsha(times)).toBe(90);
  });

  it("keeps Isha 75 minutes after a late Maghrib, as in London in June", () => {
    const times = timesOf("london", "2025-06-21", "alHadiBahrain");
    expect(times.isha?.toPlainDate().toString()).toBe("2025-06-21");
    expect(minutesBetweenMaghribAndIsha(times)).toBe(75);
  });
});

const customTimes = (angles: CustomAngles) =>
  calculatePrayerTimes(Temporal.PlainDate.from("2025-12-21"), "Asia/Baghdad", {
    coordinates: PLACES.baghdad,
    calculationMethod: "custom",
    imsakMinutes: 10,
    customAngles: angles,
  });

describe("the Custom method", () => {
  it("matches the method with the same angles", () => {
    expect(customTimes({ fajr: 18, maghrib: 4, isha: 14 })).toStrictEqual(
      timesOf("baghdad", "2025-12-21", "ithnaAshari")
    );
  });

  it("puts Maghrib at Sunset when its angle is 0", () => {
    const times = customTimes({ fajr: 18, maghrib: 0, isha: 17 });
    expect(times.maghrib?.toString()).toBe(times.sunset?.toString());
  });

  it("starts from the Al-Hadi angles when none are given", () => {
    expect(methodRules({ calculationMethod: "custom" })).toStrictEqual(
      methodRules({
        calculationMethod: "custom",
        customAngles: DEFAULT_CUSTOM_ANGLES,
      })
    );
  });

  it("keeps Ja'fari at its angles", () => {
    expect(methodRules({ calculationMethod: "jafari" })).toMatchObject({
      fajrAngle: 18,
      isha: { angle: 17 },
      maghrib: { angle: 4 },
    });
  });
});

describe("the Calculation Method list", () => {
  it("groups every method exactly once", () => {
    const grouped = CALCULATION_METHOD_GROUPS.flatMap(({ methods }) => methods);
    expect(grouped.toSorted()).toStrictEqual(CALCULATION_METHODS.toSorted());
  });

  it.each(CALCULATION_METHODS)("has rules for %s", (method) => {
    expect(METHOD_RULES[method].fajrAngle).toBeGreaterThan(0);
  });

  it("keeps Ja'fari the default", () => {
    expect(DEFAULT_CALCULATION_METHOD).toBe("jafari");
  });

  it("accepts Custom angles within their ranges", () => {
    expect(
      customAnglesSchema.safeParse({ fajr: 18, maghrib: 4, isha: 14 }).success
    ).toBeTruthy();
  });

  it.each([
    { fajr: 9.9, maghrib: 4, isha: 14 },
    { fajr: 18, maghrib: 10.1, isha: 14 },
    { fajr: 18, maghrib: -1, isha: 14 },
    { fajr: 18, maghrib: 4, isha: 25.1 },
  ])("rejects Custom angles outside their ranges: %o", (angles) => {
    expect(customAnglesSchema.safeParse(angles).success).toBeFalsy();
  });
});
