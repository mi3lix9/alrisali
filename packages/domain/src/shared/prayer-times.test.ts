import { Temporal } from "temporal-polyfill";
import { describe, expect, it } from "vitest";

import type { CalculationMethod } from "./calculation-method";
import {
  calculatePrayerTimes,
  currentPrayerTime,
  DEFAULT_HIDDEN_PRAYER_TIMES,
  nextPrayerTime,
  PRAYER_TIMES,
  readHiddenPrayerTimes,
  setPrayerTimeVisible,
} from "./prayer-times";
import type {
  Coordinates,
  PrayerTimeName,
  PrayerTimesSettings,
} from "./prayer-times";
import { locationTimeZone } from "./time-zone";

// Known-good times come from api.aladhan.com (an independent implementation),
// asked for each method's angles and Asr school, Dhuhr tuned +1 minute and no
// high-latitude adjustment, for example:
// /v1/timings/21-06-2025?latitude=26.5652&longitude=50.0124
//   &timezonestring=Asia/Riyadh&method=99&methodSettings=18,4,17&school=0
//   &midnightMode=1&tune=0,0,0,1,0,0,0,0,0&latitudeAdjustmentMethod=0
// Its geometric (0°) sunset is the "Maghrib" it gives when Maghrib is unset;
// that is the Ja'fari Sunset. The two calculations may round a minute apart.

const PLACES = {
  qatif: {
    coordinates: { latitude: 26.5652, longitude: 50.0124 },
    timeZone: "Asia/Riyadh",
  },
  najaf: {
    coordinates: { latitude: 32.0259, longitude: 44.3462 },
    timeZone: "Asia/Baghdad",
  },
  karbala: {
    coordinates: { latitude: 32.616, longitude: 44.0249 },
    timeZone: "Asia/Baghdad",
  },
  london: {
    coordinates: { latitude: 51.5074, longitude: -0.1278 },
    timeZone: "Europe/London",
  },
  reykjavik: {
    coordinates: { latitude: 64.1466, longitude: -21.9426 },
    timeZone: "Atlantic/Reykjavik",
  },
  dearborn: {
    coordinates: { latitude: 42.3223, longitude: -83.1763 },
    timeZone: "America/Detroit",
  },
} satisfies Record<string, { coordinates: Coordinates; timeZone: string }>;

type Place = keyof typeof PLACES;

const settingsFor = (
  place: Place,
  calculationMethod: CalculationMethod,
  imsakMinutes = 10
): PrayerTimesSettings => ({
  coordinates: PLACES[place].coordinates,
  calculationMethod,
  imsakMinutes,
});

const timesOn = (
  place: Place,
  date: string,
  calculationMethod: CalculationMethod,
  imsakMinutes = 10
) =>
  calculatePrayerTimes(
    Temporal.PlainDate.from(date),
    PLACES[place].timeZone,
    settingsFor(place, calculationMethod, imsakMinutes)
  );

/** "YYYY-MM-DDTHH:MM" local, so a time after 00:00 shows its date. */
const local = (time: Temporal.ZonedDateTime | null): string | null =>
  time ? time.toPlainDateTime().toString().slice(0, 16) : null;

const MINUTE_TOLERANCE = 1;

/** Expected local times; null where the sun never reaches the angle. */
type Expected = Partial<Record<PrayerTimeName, string | null>>;

/**
 * The Prayer Times that differ from `expected` by more than a minute, as
 * "name got vs wanted", so a failure shows every wrong time at once.
 */
const mismatches = (
  place: Place,
  date: string,
  method: CalculationMethod,
  expected: Expected
): string[] => {
  const times = timesOn(place, date, method);
  return PRAYER_TIMES.flatMap((name) => {
    const want = expected[name];
    if (want === undefined) {
      return [];
    }
    const got = times[name];
    if (want === null || got === null) {
      return want === null && got === null
        ? []
        : [`${name} ${local(got)} vs ${want}`];
    }
    const wanted = Temporal.PlainDateTime.from(
      want.length === 5 ? `${date}T${want}` : want
    ).toZonedDateTime(PLACES[place].timeZone);
    const minutesApart = Math.abs(got.since(wanted).total("minutes"));
    return minutesApart <= MINUTE_TOLERANCE
      ? []
      : [`${name} ${local(got)} vs ${want}`];
  });
};

const at = (dateTime: string, timeZone: string) =>
  Temporal.PlainDateTime.from(dateTime).toZonedDateTime(timeZone).toInstant();

describe("prayer times by calculation method", () => {
  it("gives Ja'fari times in Qatif in midsummer", () => {
    expect(
      mismatches("qatif", "2025-06-21", "jafari", {
        imsak: "03:06",
        fajr: "03:16",
        sunrise: "04:48",
        dhuhr: "11:43",
        asr: "15:08",
        sunset: "18:32",
        maghrib: "18:52",
        isha: "20:02",
      })
    ).toStrictEqual([]);
  });

  it("gives Ja'fari times in Najaf at the equinox", () => {
    expect(
      mismatches("najaf", "2025-03-20", "jafari", {
        imsak: "04:35",
        fajr: "04:45",
        sunrise: "06:06",
        dhuhr: "12:11",
        asr: "15:37",
        sunset: "18:10",
        maghrib: "18:29",
        isha: "19:31",
      })
    ).toStrictEqual([]);
  });

  it("gives Ja'fari times in Karbala in midwinter", () => {
    expect(
      mismatches("karbala", "2025-12-21", "jafari", {
        fajr: "05:34",
        sunrise: "07:02",
        dhuhr: "12:03",
        asr: "14:44",
        sunset: "16:58",
        maghrib: "17:19",
        isha: "18:25",
      })
    ).toStrictEqual([]);
  });

  it("gives Sunni times: Sunset at 0.833°, and Maghrib is Sunset", () => {
    expect(
      mismatches("qatif", "2025-06-21", "sunni", {
        fajr: "03:16",
        sunrise: "04:48",
        dhuhr: "11:43",
        asr: "15:08",
        sunset: "18:36",
        maghrib: "18:36",
        isha: "20:02",
        midnight: "22:56",
      })
    ).toStrictEqual([]);
    expect(
      mismatches("karbala", "2025-12-21", "sunni", {
        sunset: "17:02",
        maghrib: "17:02",
        isha: "18:25",
      })
    ).toStrictEqual([]);
  });

  it("gives Hanafi times: Asr at shadow factor 2", () => {
    expect(
      mismatches("qatif", "2025-06-21", "hanafi", {
        asr: "16:28",
        maghrib: "18:36",
      })
    ).toStrictEqual([]);
    expect(
      mismatches("najaf", "2025-03-20", "hanafi", { asr: "16:30" })
    ).toStrictEqual([]);
    expect(
      mismatches("karbala", "2025-12-21", "hanafi", { asr: "15:25" })
    ).toStrictEqual([]);
  });

  it("gives Ibadi times: Isha at 18°", () => {
    expect(
      mismatches("qatif", "2025-06-21", "ibadi", {
        asr: "15:08",
        maghrib: "18:36",
        isha: "20:07",
      })
    ).toStrictEqual([]);
    expect(
      mismatches("najaf", "2025-03-20", "ibadi", { isha: "19:36" })
    ).toStrictEqual([]);
    expect(
      mismatches("karbala", "2025-12-21", "ibadi", { isha: "18:30" })
    ).toStrictEqual([]);
  });

  it("gives London summer times in British Summer Time", () => {
    expect(
      mismatches("london", "2025-07-01", "sunni", {
        sunrise: "04:48",
        dhuhr: "13:05",
        asr: "17:27",
        sunset: "21:21",
      })
    ).toStrictEqual([]);
    expect(
      mismatches("london", "2025-07-01", "hanafi", { asr: "18:41" })
    ).toStrictEqual([]);
  });
});

describe("imsak and midnight", () => {
  it("puts Imsak the configured minutes before Fajr", () => {
    const times = timesOn("najaf", "2025-03-20", "jafari", 15);

    expect(times.fajr?.since(times.imsak ?? times.fajr).total("minutes")).toBe(
      15
    );
  });

  it("puts Midnight halfway between Sunset and the next day's Fajr", () => {
    for (const method of ["jafari", "sunni"] as const) {
      const today = timesOn("karbala", "2025-12-21", method);
      const tomorrow = timesOn("karbala", "2025-12-22", method);
      const { sunset, midnight } = today;
      const nextFajr = tomorrow.fajr;

      expect(sunset && midnight && nextFajr).toBeTruthy();
      const night = nextFajr?.since(sunset ?? nextFajr).total("minutes") ?? 0;
      const toMidnight =
        midnight?.since(sunset ?? midnight).total("minutes") ?? 0;

      expect(Math.abs(toMidnight - night / 2)).toBeLessThanOrEqual(1);
    }
  });

  it("lets Midnight fall on the next calendar date", () => {
    expect(
      mismatches("london", "2025-03-30", "sunni", {
        midnight: "2025-03-31T00:07",
      })
    ).toStrictEqual([]);
  });
});

describe("time zones and daylight saving", () => {
  it("moves the clock times an hour on the day summer time starts", () => {
    expect(
      mismatches("london", "2025-03-29", "sunni", {
        fajr: "03:45",
        dhuhr: "12:06",
        sunset: "18:29",
        isha: "20:19",
      })
    ).toStrictEqual([]);
    expect(
      mismatches("london", "2025-03-30", "sunni", {
        fajr: "04:42",
        sunrise: "06:40",
        dhuhr: "13:06",
        asr: "16:35",
        sunset: "19:31",
        isha: "21:21",
      })
    ).toStrictEqual([]);

    expect(timesOn("london", "2025-03-29", "sunni").dhuhr?.offset).toBe(
      "+00:00"
    );
    expect(timesOn("london", "2025-03-30", "sunni").dhuhr?.offset).toBe(
      "+01:00"
    );
  });

  it("uses the winter offset on the day summer time ends", () => {
    expect(
      mismatches("london", "2025-10-26", "sunni", {
        fajr: "04:51",
        sunrise: "06:44",
        dhuhr: "11:45",
        asr: "14:16",
        sunset: "16:44",
        isha: "18:30",
        midnight: "22:48",
      })
    ).toStrictEqual([]);

    expect(timesOn("london", "2025-10-26", "sunni").fajr?.offset).toBe(
      "+00:00"
    );
  });

  it("gives the same instants whatever time zone they are shown in", () => {
    const settings = settingsFor("qatif", "jafari");
    const date = Temporal.PlainDate.from("2025-06-21");
    const riyadh = calculatePrayerTimes(date, "Asia/Riyadh", settings);
    const utc = calculatePrayerTimes(date, "UTC", settings);

    expect(
      riyadh.dhuhr?.toInstant().equals(utc.dhuhr?.toInstant() ?? "")
    ).toBeTruthy();
    expect(local(utc.dhuhr)).toBe("2025-06-21T08:43");
  });
});

describe("the location's own time zone", () => {
  it("resolves each place's IANA time zone from its coordinates", () => {
    for (const { coordinates, timeZone } of Object.values(PLACES)) {
      expect(locationTimeZone(coordinates)).toBe(timeZone);
    }
  });

  it("gives a city in another time zone its local times across a daylight-saving change", () => {
    // US summer time starts on 9 March 2025, two weeks before London's.
    expect(
      mismatches("dearborn", "2025-03-08", "sunni", {
        fajr: "05:23",
        sunrise: "06:56",
        dhuhr: "12:44",
        asr: "15:57",
        sunset: "18:31",
        isha: "19:59",
      })
    ).toStrictEqual([]);
    expect(
      mismatches("dearborn", "2025-03-09", "sunni", {
        fajr: "06:21",
        sunrise: "07:54",
        dhuhr: "13:44",
        asr: "16:58",
        sunset: "19:33",
        isha: "21:00",
      })
    ).toStrictEqual([]);

    const dearborn = settingsFor("dearborn", "sunni");
    const zone = locationTimeZone(dearborn.coordinates);
    for (const [date, offset] of [
      ["2025-03-08", "-05:00"],
      ["2025-03-09", "-04:00"],
    ] as const) {
      expect(
        calculatePrayerTimes(Temporal.PlainDate.from(date), zone, dearborn)
          .dhuhr?.offset
      ).toBe(offset);
    }
  });

  it("counts down on the city's clock, not the device's", () => {
    // 10:00 in London is 12:00 in Qatif on 21 June 2025.
    const now = at("2025-06-21T10:00", "Europe/London");
    const next = nextPrayerTime(now, settingsFor("qatif", "jafari"), []);

    expect(next?.name).toBe("asr");
    expect(next?.at.timeZoneId).toBe("Asia/Riyadh");
    expect(next?.at.toPlainDate().toString()).toBe("2025-06-21");
  });

  it("takes the city's date when it is already tomorrow there", () => {
    // 22:30 in London is 00:30 on 22 June in Qatif, past last night's Midnight.
    const now = at("2025-06-21T22:30", "Europe/London");
    const qatif = settingsFor("qatif", "jafari");

    expect(currentPrayerTime(now, qatif, [])?.name).toBe("midnight");
    const next = nextPrayerTime(now, qatif, []);
    expect(next?.name).toBe("imsak");
    expect(next?.at.toPlainDate().toString()).toBe("2025-06-22");
  });
});

describe("high latitudes", () => {
  it("falls back to Sunset for Ja'fari Maghrib when the sun never reaches 4°", () => {
    const times = timesOn("reykjavik", "2025-06-21", "jafari");

    expect(times.sunset).not.toBeNull();
    expect(local(times.maghrib)).toBe(local(times.sunset));
  });

  it("defines every Prayer Time for London on 21 June with the default rule", () => {
    const times = timesOn("london", "2025-06-21", "jafari");

    expect(Object.values(times).every((time) => time !== null)).toBeTruthy();
  });

  it("defines every Prayer Time for Reykjavik on 21 June with the default rule", () => {
    const times = timesOn("reykjavik", "2025-06-21", "jafari");

    expect(Object.values(times).every((time) => time !== null)).toBeTruthy();
  });
});

describe("next and current prayer time", () => {
  const qatif = settingsFor("qatif", "jafari");

  it("skips Hidden Prayer Times", () => {
    const now = at("2025-06-21T12:00", "Asia/Riyadh");

    expect(nextPrayerTime(now, qatif, DEFAULT_HIDDEN_PRAYER_TIMES)?.name).toBe(
      "maghrib"
    );
    expect(nextPrayerTime(now, qatif, [])?.name).toBe("asr");
    expect(
      nextPrayerTime(now, qatif, ["asr", "sunset", "maghrib", "isha"])?.name
    ).toBe("midnight");
    expect(
      currentPrayerTime(now, qatif, DEFAULT_HIDDEN_PRAYER_TIMES)?.name
    ).toBe("dhuhr");
  });

  it("rolls over to tomorrow after the last visible time", () => {
    const now = at("2025-06-21T23:30", "Asia/Riyadh");
    const next = nextPrayerTime(now, qatif, DEFAULT_HIDDEN_PRAYER_TIMES);

    expect(next?.name).toBe("fajr");
    expect(next?.at.toPlainDate().toString()).toBe("2025-06-22");
    expect(
      currentPrayerTime(now, qatif, DEFAULT_HIDDEN_PRAYER_TIMES)?.name
    ).toBe("midnight");
  });

  it("counts down to last night's Midnight when it falls after 00:00", () => {
    const london = settingsFor("london", "jafari");
    const now = at("2025-03-31T00:01", "Europe/London");
    const next = nextPrayerTime(now, london, DEFAULT_HIDDEN_PRAYER_TIMES);

    expect(next?.name).toBe("midnight");
    expect(next?.at.toPlainDate().toString()).toBe("2025-03-31");
  });

  it("has no next time when every Prayer Time is hidden", () => {
    const now = at("2025-06-21T12:00", "Asia/Riyadh");

    expect(nextPrayerTime(now, qatif, PRAYER_TIMES)).toBeNull();
  });
});

describe("hidden prayer times", () => {
  it("hides Imsak, Asr, Sunset and Isha by default", () => {
    expect(readHiddenPrayerTimes(null)).toStrictEqual([
      "imsak",
      "asr",
      "sunset",
      "isha",
    ]);
  });

  it("keeps known names once, in the day's order", () => {
    expect(
      readHiddenPrayerTimes(["isha", "noon", "fajr", "isha", 3])
    ).toStrictEqual(["fajr", "isha"]);
    expect(readHiddenPrayerTimes([])).toStrictEqual([]);
  });

  it("shows and hides one Prayer Time", () => {
    const shown = setPrayerTimeVisible(
      DEFAULT_HIDDEN_PRAYER_TIMES,
      "asr",
      true
    );

    expect(shown).toStrictEqual(["imsak", "sunset", "isha"]);
    expect(setPrayerTimeVisible(shown, "fajr", false)).toStrictEqual([
      "imsak",
      "fajr",
      "sunset",
      "isha",
    ]);
  });
});
