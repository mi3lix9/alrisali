import { Temporal } from "temporal-polyfill";
import { describe, expect, it } from "vitest";

import {
  CONVERTER_RANGE,
  convertedCalendars,
  createDateConverter,
  swapCalendar,
} from "./date-converter";
import { createHijriCalendar } from "./hijri";

const day = (iso: string) => Temporal.PlainDate.from(iso);

describe(createDateConverter, () => {
  const converter = createDateConverter({ hijri: createHijriCalendar() });

  it("reads one day in the Hijri, Gregorian and Shamsi calendars", () => {
    const date = day("2026-10-15");
    expect(converter.read("hijri", date)).toStrictEqual({
      year: 1448,
      month: 5,
      day: 4,
    });
    expect(converter.read("gregorian", date)).toStrictEqual({
      year: 2026,
      month: 10,
      day: 15,
    });
    expect(converter.read("shamsi", date)).toStrictEqual({
      year: 1405,
      month: 7,
      day: 23,
    });
  });

  it("turns a date picked in any calendar into the same day", () => {
    expect(
      converter.toDate("hijri", { year: 1447, month: 1, day: 1 })
    ).toStrictEqual(day("2025-06-26"));
    expect(
      converter.toDate("gregorian", { year: 2026, month: 10, day: 15 })
    ).toStrictEqual(day("2026-10-15"));
    expect(
      converter.toDate("shamsi", { year: 1404, month: 1, day: 1 })
    ).toStrictEqual(day("2025-03-21"));
  });

  it("follows the effective Hijri Adjustment both ways", () => {
    const ahead = createDateConverter({
      hijri: createHijriCalendar({ adjustment: 1 }),
    });
    expect(ahead.read("hijri", day("2025-06-25"))).toStrictEqual({
      year: 1447,
      month: 1,
      day: 1,
    });
    expect(
      ahead.toDate("hijri", { year: 1447, month: 1, day: 1 })
    ).toStrictEqual(day("2025-06-25"));
  });

  it("keeps the day within the month when the month or year changes", () => {
    expect(
      converter.toDate("gregorian", { year: 2026, month: 2, day: 31 })
    ).toStrictEqual(day("2026-02-28"));
    expect(
      converter.toDate("shamsi", { year: 1404, month: 12, day: 30 })
    ).toStrictEqual(day("2026-03-20"));
    expect(
      converter.read(
        "hijri",
        converter.toDate("hijri", { year: 1446, month: 9, day: 30 })
      )
    ).toStrictEqual({ year: 1446, month: 9, day: 29 });
  });

  it("gives each calendar's month length", () => {
    expect(converter.monthLength("gregorian", 2024, 2)).toBe(29);
    expect(converter.monthLength("shamsi", 1403, 12)).toBe(30);
    expect(converter.monthLength("hijri", 1446, 9)).toBe(29);
  });

  it("offers the years its range covers in each calendar", () => {
    expect(converter.years("gregorian")).toStrictEqual({
      first: 1900,
      last: 2100,
    });
    expect(converter.years("shamsi")).toStrictEqual({
      first: 1278,
      last: 1479,
    });
    expect(converter.years("hijri")).toStrictEqual({
      first: 1317,
      last: 1524,
    });
  });

  it("holds a picked date inside its range", () => {
    expect(
      converter.toDate("shamsi", { year: 1278, month: 1, day: 1 })
    ).toStrictEqual(CONVERTER_RANGE.earliest);
    expect(
      converter.toDate("hijri", { year: 1524, month: 12, day: 29 })
    ).toStrictEqual(CONVERTER_RANGE.latest);
  });
});

describe(convertedCalendars, () => {
  it("lists the other calendars, Hijri first", () => {
    expect(convertedCalendars("gregorian")).toStrictEqual(["hijri", "shamsi"]);
    expect(convertedCalendars("hijri")).toStrictEqual(["gregorian", "shamsi"]);
  });
});

describe(swapCalendar, () => {
  it("makes the first converted calendar the new source", () => {
    expect(swapCalendar("hijri")).toBe("gregorian");
    expect(swapCalendar("gregorian")).toBe("hijri");
    expect(swapCalendar("shamsi")).toBe("hijri");
  });
});
