import { Temporal } from "temporal-polyfill";
import { describe, expect, it } from "vitest";

import { fromShamsi, shamsiMonthLength, toShamsi } from "./shamsi";

const day = (iso: string) => Temporal.PlainDate.from(iso);

describe(toShamsi, () => {
  it("starts the year at Nowruz, the day after the last of Esfand", () => {
    expect(toShamsi(day("2024-03-19"))).toStrictEqual({
      year: 1402,
      month: 12,
      day: 29,
    });
    expect(toShamsi(day("2024-03-20"))).toStrictEqual({
      year: 1403,
      month: 1,
      day: 1,
    });
  });

  it("gives a leap year's Esfand a 30th day before Nowruz", () => {
    expect(toShamsi(day("2025-03-20"))).toStrictEqual({
      year: 1403,
      month: 12,
      day: 30,
    });
    expect(toShamsi(day("2025-03-21"))).toStrictEqual({
      year: 1404,
      month: 1,
      day: 1,
    });
  });

  it("starts Nowruz on 21 March when the equinox falls after noon in Tehran", () => {
    expect(toShamsi(day("2026-03-20"))).toStrictEqual({
      year: 1404,
      month: 12,
      day: 29,
    });
    expect(toShamsi(day("2026-03-21"))).toStrictEqual({
      year: 1405,
      month: 1,
      day: 1,
    });
  });

  it("switches from 31-day to 30-day months at Mehr", () => {
    expect(toShamsi(day("2026-09-22"))).toStrictEqual({
      year: 1405,
      month: 6,
      day: 31,
    });
    expect(toShamsi(day("2026-09-23"))).toStrictEqual({
      year: 1405,
      month: 7,
      day: 1,
    });
  });

  it("reads a well-known date: 22 Bahman 1357", () => {
    expect(toShamsi(day("1979-02-11"))).toStrictEqual({
      year: 1357,
      month: 11,
      day: 22,
    });
  });

  it("agrees with the ICU Persian calendar for every day of 1900–2100", () => {
    const icu = new Intl.DateTimeFormat("en-u-ca-persian-nu-latn", {
      timeZone: "UTC",
      year: "numeric",
      month: "numeric",
      day: "numeric",
    });
    const mismatches: string[] = [];
    for (
      let date = day("1900-01-01");
      Temporal.PlainDate.compare(date, day("2100-12-31")) <= 0;
      date = date.add({ days: 1 })
    ) {
      const parts = Object.fromEntries(
        icu
          .formatToParts(new Date(`${date.toString()}T12:00:00Z`))
          .map(({ type, value }) => [type, value])
      );
      const expected = `${parts.year}/${parts.month}/${parts.day}`;
      const shamsi = toShamsi(date);
      const actual = `${shamsi.year}/${shamsi.month}/${shamsi.day}`;
      if (actual !== expected) {
        mismatches.push(`${date.toString()}: ${actual} ≠ ${expected}`);
      }
    }
    expect(mismatches).toStrictEqual([]);
  });
});

describe(fromShamsi, () => {
  it("turns Nowruz and the last of Esfand back into Gregorian days", () => {
    expect(fromShamsi({ year: 1403, month: 1, day: 1 })).toStrictEqual(
      day("2024-03-20")
    );
    expect(fromShamsi({ year: 1403, month: 12, day: 30 })).toStrictEqual(
      day("2025-03-20")
    );
    expect(fromShamsi({ year: 1405, month: 7, day: 23 })).toStrictEqual(
      day("2026-10-15")
    );
  });

  it("round-trips every day across many year boundaries", () => {
    for (
      let date = day("1990-01-01");
      Temporal.PlainDate.compare(date, day("2040-12-31")) <= 0;
      date = date.add({ days: 1 })
    ) {
      expect(fromShamsi(toShamsi(date))).toStrictEqual(date);
    }
  });

  it("rejects a day the month does not have", () => {
    expect(() => fromShamsi({ year: 1404, month: 12, day: 30 })).toThrow(
      RangeError
    );
    expect(() => fromShamsi({ year: 1404, month: 7, day: 31 })).toThrow(
      RangeError
    );
    expect(() => fromShamsi({ year: 1404, month: 13, day: 1 })).toThrow(
      RangeError
    );
  });
});

describe(shamsiMonthLength, () => {
  it("runs 31 days for the first six months and 30 for the next five", () => {
    expect(shamsiMonthLength(1405, 1)).toBe(31);
    expect(shamsiMonthLength(1405, 6)).toBe(31);
    expect(shamsiMonthLength(1405, 7)).toBe(30);
    expect(shamsiMonthLength(1405, 11)).toBe(30);
  });

  it("gives Esfand 30 days in a leap year and 29 otherwise", () => {
    expect(shamsiMonthLength(1399, 12)).toBe(30);
    expect(shamsiMonthLength(1403, 12)).toBe(30);
    expect(shamsiMonthLength(1408, 12)).toBe(30);
    expect(shamsiMonthLength(1402, 12)).toBe(29);
    expect(shamsiMonthLength(1404, 12)).toBe(29);
  });
});
