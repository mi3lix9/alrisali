import { Temporal } from "temporal-polyfill";
import { describe, expect, it } from "vitest";

import { calculatePrayerTimes, createHijriCalendar } from "../shared";
import type { PrayerTimesSettings } from "../shared";
import {
  LAYLAT_AL_QADR_NIGHTS,
  monthlyTimetable,
  ramadanImsakiyya,
  shiftTimetableMonth,
} from "./timetable";
import type { TimetablePlace } from "./timetable";

const settings: PrayerTimesSettings = {
  coordinates: { latitude: 26.5652, longitude: 50.0124 },
  calculationMethod: "jafari",
  imsakMinutes: 10,
};

const place: TimetablePlace = {
  calendar: createHijriCalendar(),
  timeZone: "Asia/Riyadh",
  settings,
};

describe(monthlyTimetable, () => {
  it("has a row for every day of a Gregorian month, in order", () => {
    const rows = monthlyTimetable(
      { kind: "gregorian", year: 2026, month: 2 },
      place
    );
    expect(rows).toHaveLength(28);
    expect(rows[0]?.date.toString()).toBe("2026-02-01");
    expect(rows.at(-1)?.date.toString()).toBe("2026-02-28");
  });

  it("has a row for every day of a Hijri month, with its Hijri date", () => {
    const rows = monthlyTimetable(
      { kind: "hijri", year: 1447, month: 9 },
      place
    );
    expect(rows).toHaveLength(place.calendar.monthLength(1447, 9));
    expect(rows.map(({ hijri }) => hijri.day)).toStrictEqual(
      rows.map((_, index) => index + 1)
    );
    expect(rows.every(({ hijri }) => hijri.month === 9)).toBeTruthy();
  });

  it("gives each row the Prayer Times the Prayer tab shows for its date", () => {
    const rows = monthlyTimetable(
      { kind: "gregorian", year: 2026, month: 3 },
      place
    );
    for (const row of rows) {
      expect(row.times).toStrictEqual(
        calculatePrayerTimes(row.date, place.timeZone, settings)
      );
      expect(row.hijri).toStrictEqual(place.calendar.toHijri(row.date));
    }
  });

  it("gives the Hijri date of each Gregorian day", () => {
    const [first] = monthlyTimetable(
      { kind: "gregorian", year: 2026, month: 10 },
      place
    );
    expect(first?.hijri).toStrictEqual(
      place.calendar.toHijri(Temporal.PlainDate.from("2026-10-01"))
    );
  });

  it("keeps the times in the place's own zone", () => {
    const [row] = monthlyTimetable(
      { kind: "gregorian", year: 2026, month: 1 },
      { ...place, timeZone: "Asia/Baghdad" }
    );
    expect(row?.times.fajr?.timeZoneId).toBe("Asia/Baghdad");
  });
});

describe(ramadanImsakiyya, () => {
  const rows = ramadanImsakiyya(1447, place);

  it("covers every day of Ramadan, from the 1st", () => {
    expect(rows).toHaveLength(place.calendar.monthLength(1447, 9));
    expect(rows[0]?.day).toBe(1);
    expect(rows[0]?.date).toStrictEqual(
      place.calendar.toGregorian({ year: 1447, month: 9, day: 1 })
    );
  });

  it("gives Imsak and Iftar as the day's Imsak and Maghrib", () => {
    for (const row of rows) {
      const times = calculatePrayerTimes(row.date, place.timeZone, settings);
      expect(row.imsak).toStrictEqual(times.imsak);
      expect(row.iftar).toStrictEqual(times.maghrib);
      expect(row.fajr).toStrictEqual(times.fajr);
      expect(row.dhuhr).toStrictEqual(times.dhuhr);
    }
  });

  it("puts Imsak before Fajr and Iftar after midday", () => {
    for (const { imsak, fajr, dhuhr, iftar } of rows) {
      expect(imsak?.epochMilliseconds).toBeLessThan(
        fajr?.epochMilliseconds ?? Number.NEGATIVE_INFINITY
      );
      expect(iftar?.epochMilliseconds).toBeGreaterThan(
        dhuhr?.epochMilliseconds ?? Number.POSITIVE_INFINITY
      );
    }
  });

  it("marks the nights of the 19th, 21st and 23rd", () => {
    expect(
      rows.filter(({ qadrNight }) => qadrNight).map(({ day }) => day)
    ).toStrictEqual([...LAYLAT_AL_QADR_NIGHTS]);
  });

  it("follows the Imsak minutes of the settings", () => {
    const [first] = ramadanImsakiyya(1447, {
      ...place,
      settings: { ...settings, imsakMinutes: 20 },
    });
    expect(first?.fajr && first.imsak).toBeTruthy();
    expect(
      ((first?.fajr?.epochMilliseconds ?? 0) -
        (first?.imsak?.epochMilliseconds ?? 0)) /
        60_000
    ).toBe(20);
  });
});

describe(shiftTimetableMonth, () => {
  it("moves a Gregorian month across years", () => {
    expect(
      shiftTimetableMonth({ kind: "gregorian", year: 2026, month: 12 }, 1)
    ).toStrictEqual({ kind: "gregorian", year: 2027, month: 1 });
    expect(
      shiftTimetableMonth({ kind: "gregorian", year: 2026, month: 1 }, -1)
    ).toStrictEqual({ kind: "gregorian", year: 2025, month: 12 });
  });

  it("moves a Hijri month across years", () => {
    expect(
      shiftTimetableMonth({ kind: "hijri", year: 1447, month: 12 }, 1)
    ).toStrictEqual({ kind: "hijri", year: 1448, month: 1 });
    expect(
      shiftTimetableMonth({ kind: "hijri", year: 1447, month: 1 }, -1)
    ).toStrictEqual({ kind: "hijri", year: 1446, month: 12 });
  });
});
