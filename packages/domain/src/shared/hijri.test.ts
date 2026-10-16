import { Temporal } from "temporal-polyfill";
import { describe, expect, it } from "vitest";

import {
  addHijriMonths,
  createHijriCalendar,
  createUmmAlQuraConverter,
  DEFAULT_ADMIN_HIJRI_ADJUSTMENT,
  defaultHijriConverter,
  effectiveHijriAdjustment,
  forcedHijriDateProblem,
  forcedHijriDateSchema,
  hijriAdjustmentSchema,
  isInHijriWindow,
  tabularHijriConverter,
} from "./hijri";
import type {
  CreateDateTimeFormat,
  ForcedHijriDate,
  HijriMonth,
  HijriWindow,
} from "./hijri";

const day = (iso: string) => Temporal.PlainDate.from(iso);

/** An engine whose Intl ignores `-u-ca-islamic-umalqura`, as Hermes may. */
const gregorianOnly: CreateDateTimeFormat = () => ({
  formatToParts: (date) => [
    { type: "month", value: String(date.getUTCMonth() + 1) },
    { type: "literal", value: "/" },
    { type: "day", value: String(date.getUTCDate()) },
    { type: "literal", value: "/" },
    { type: "year", value: String(date.getUTCFullYear()) },
  ],
});

/** An engine that honours the calendar but writes Arabic-Indic digits. */
const arabicDigits: CreateDateTimeFormat = (locale, options) => {
  const inner = new Intl.DateTimeFormat(locale, options);
  return {
    formatToParts: (date) =>
      inner.formatToParts(date).map((part) => ({
        ...part,
        value: part.value.replaceAll(/\d/gu, (digit) =>
          String.fromCodePoint(0x06_60 + Number(digit))
        ),
      })),
  };
};

describe("Hijri conversion", () => {
  const calendar = createHijriCalendar();

  it("follows Umm al-Qura", () => {
    expect(calendar.toHijri(day("2025-03-01"))).toStrictEqual({
      year: 1446,
      month: 9,
      day: 1,
    });
    expect(calendar.toHijri(day("2025-06-26"))).toStrictEqual({
      year: 1447,
      month: 1,
      day: 1,
    });
    expect(calendar.toHijri(day("2026-10-15"))).toStrictEqual({
      year: 1448,
      month: 5,
      day: 4,
    });
  });

  it("converts a Hijri Date back to its Gregorian day", () => {
    expect(
      calendar.toGregorian({ year: 1447, month: 1, day: 1 })
    ).toStrictEqual(day("2025-06-26"));
    expect(
      calendar.toGregorian({ year: 1448, month: 5, day: 30 })
    ).toStrictEqual(day("2026-11-10"));
  });

  it("knows 29- and 30-day months", () => {
    expect(calendar.monthLength(1446, 12)).toBe(29);
    expect(calendar.monthLength(1448, 5)).toBe(30);
  });

  it("refuses a day the month does not have", () => {
    expect(() =>
      calendar.toGregorian({ year: 1446, month: 12, day: 30 })
    ).toThrow(RangeError);
  });

  it("falls back to the arithmetic calendar when Intl ignores the Islamic calendar", () => {
    expect(createUmmAlQuraConverter(gregorianOnly)).toBeNull();

    const fallback = createHijriCalendar({ converter: tabularHijriConverter });
    // Tabular (civil) months start a day after Umm al-Qura here.
    expect(fallback.toHijri(day("2025-06-26"))).toStrictEqual({
      year: 1446,
      month: 12,
      day: 29,
    });
    expect(fallback.toHijri(day("2025-06-27"))).toStrictEqual({
      year: 1447,
      month: 1,
      day: 1,
    });
    expect(
      fallback.toGregorian({ year: 1448, month: 5, day: 3 })
    ).toStrictEqual(day("2026-10-15"));
  });

  it("reads Umm al-Qura from an engine that writes Arabic-Indic digits", () => {
    const converter = createUmmAlQuraConverter(arabicDigits);

    expect(converter?.kind).toBe("umm-al-qura");
    expect(
      createHijriCalendar({
        converter: converter ?? tabularHijriConverter,
      }).toHijri(day("2025-03-01"))
    ).toStrictEqual({ year: 1446, month: 9, day: 1 });
  });

  it("round-trips every day across several years", () => {
    const end = day("2027-01-01");
    const mismatches: string[] = [];
    for (
      let date = day("2024-01-01");
      Temporal.PlainDate.compare(date, end) < 0;
      date = date.add({ days: 1 })
    ) {
      if (!calendar.toGregorian(calendar.toHijri(date)).equals(date)) {
        mismatches.push(date.toString());
      }
    }

    expect(mismatches).toStrictEqual([]);
  });
});

describe(effectiveHijriAdjustment, () => {
  const converter = defaultHijriConverter();
  // A moon sighting puts 1 Jumada al-Akhirah 1448 on 12 November 2026, a day
  // after Umm al-Qura's 11 November, until the end of that month.
  const sighting: ForcedHijriDate = {
    date: { year: 1448, month: 6, day: 1 },
    from: "2026-11-12",
    until: "2026-12-10",
  };
  const admin = { offset: 1, forced: sighting };
  const shownOn = (today: string, believer = 0) =>
    createHijriCalendar({
      adjustment: effectiveHijriAdjustment({
        admin,
        believer,
        today: day(today),
        converter,
      }),
      converter,
    }).toHijri(day(today));

  it("adds the Believer's adjustment to the Admins' offset", () => {
    const today = day("2026-10-16");
    expect(
      effectiveHijriAdjustment({
        admin: { offset: 1, forced: null },
        believer: -2,
        today,
        converter,
      })
    ).toBe(-1);
    expect(
      effectiveHijriAdjustment({
        admin: DEFAULT_ADMIN_HIJRI_ADJUSTMENT,
        believer: 0,
        today,
        converter,
      })
    ).toBe(0);
  });

  it("shows the forced date on its first day and counts on from it until it expires", () => {
    expect(shownOn("2026-11-12")).toStrictEqual({
      year: 1448,
      month: 6,
      day: 1,
    });
    expect(shownOn("2026-12-10")).toStrictEqual({
      year: 1448,
      month: 6,
      day: 29,
    });
  });

  it("falls back to the Admins' offset after the forced date expires", () => {
    expect(
      effectiveHijriAdjustment({
        admin,
        believer: 0,
        today: day("2026-12-11"),
        converter,
      })
    ).toBe(1);
  });

  it("keeps the Admins' offset before the forced date starts", () => {
    expect(
      effectiveHijriAdjustment({
        admin,
        believer: 0,
        today: day("2026-11-11"),
        converter,
      })
    ).toBe(1);
  });

  it("adds the Believer's own adjustment on top of the forced date", () => {
    expect(shownOn("2026-11-12", 1)).toStrictEqual({
      year: 1448,
      month: 6,
      day: 2,
    });
  });

  it("reaches the forced date on an engine without Umm al-Qura", () => {
    const adjustment = effectiveHijriAdjustment({
      admin,
      believer: 0,
      today: day("2026-11-12"),
      converter: tabularHijriConverter,
    });

    expect(
      createHijriCalendar({
        adjustment,
        converter: tabularHijriConverter,
      }).toHijri(day("2026-11-12"))
    ).toStrictEqual({ year: 1448, month: 6, day: 1 });
  });
});

describe("Forced Hijri Date", () => {
  it("refuses an expiry before the forced date starts", () => {
    expect(
      forcedHijriDateSchema.safeParse({
        date: { year: 1448, month: 6, day: 1 },
        from: "2026-11-12",
        until: "2026-11-11",
      }).success
    ).toBeFalsy();
  });

  it("refuses a Gregorian day that does not exist", () => {
    expect(
      forcedHijriDateSchema.safeParse({
        date: { year: 1448, month: 6, day: 1 },
        from: "2026-02-30",
        until: "2026-03-30",
      }).success
    ).toBeFalsy();
  });

  it("accepts a forced date that lasts a single day", () => {
    expect(
      forcedHijriDateSchema.safeParse({
        date: { year: 1448, month: 6, day: 1 },
        from: "2026-11-12",
        until: "2026-11-12",
      }).success
    ).toBeTruthy();
  });
});

describe(forcedHijriDateProblem, () => {
  const converter = defaultHijriConverter();

  it("accepts a forced date within two days of the computed one", () => {
    expect(
      forcedHijriDateProblem({
        forced: {
          date: { year: 1448, month: 6, day: 1 },
          from: "2026-11-13",
          until: "2026-12-10",
        },
        converter,
      })
    ).toBeNull();
  });

  it("refuses a forced date more than two days from the computed one", () => {
    expect(
      forcedHijriDateProblem({
        forced: {
          date: { year: 1448, month: 6, day: 1 },
          from: "2026-11-14",
          until: "2026-12-10",
        },
        converter,
      })
    ).toBe("too-far");
  });

  it("refuses a day the computed month does not have", () => {
    // Umm al-Qura's Dhu al-Hijjah 1446 has 29 days.
    expect(
      forcedHijriDateProblem({
        forced: {
          date: { year: 1446, month: 12, day: 30 },
          from: "2025-06-26",
          until: "2025-06-26",
        },
        converter,
      })
    ).toBe("missing-day");
  });
});

describe("Hijri Adjustment", () => {
  it("lets the Believer shift by at most two days", () => {
    expect(
      [-3, -2, 2, 3, 0.5].map(
        (days) => hijriAdjustmentSchema.safeParse(days).success
      )
    ).toStrictEqual([false, true, true, false, false]);
  });

  it("moves every Hijri Date by the adjustment, both ways", () => {
    const ahead = createHijriCalendar({ adjustment: 1 });
    const behind = createHijriCalendar({ adjustment: -1 });

    expect(ahead.toHijri(day("2025-06-25"))).toStrictEqual({
      year: 1447,
      month: 1,
      day: 1,
    });
    expect(behind.toHijri(day("2025-06-26"))).toStrictEqual({
      year: 1446,
      month: 12,
      day: 29,
    });
    expect(behind.toGregorian({ year: 1447, month: 1, day: 1 })).toStrictEqual(
      day("2025-06-27")
    );
  });
});

describe("Hijri month grid", () => {
  it("lists the month's days with their Gregorian dates", () => {
    const grid = createHijriCalendar().monthGrid(1448, 5);

    expect(grid.days).toHaveLength(30);
    expect(grid.days[0]?.date).toStrictEqual(day("2026-10-12"));
    expect(grid.days.at(-1)?.date).toStrictEqual(day("2026-11-10"));
  });

  it("lays out weeks starting on Saturday", () => {
    const grid = createHijriCalendar().monthGrid(1448, 5);

    // 1 Jumada al-Ula 1448 is a Monday: Saturday and Sunday come first, empty.
    expect(
      grid.weeks[0]?.slice(0, 3).map((cell) => cell?.hijri.day ?? null)
    ).toStrictEqual([null, null, 1]);
    expect(grid.weeks.map((week) => week.length)).toStrictEqual([
      7, 7, 7, 7, 7,
    ]);
    expect(grid.weeks.flat().filter(Boolean)).toHaveLength(30);
  });

  it("can start weeks on Monday", () => {
    const grid = createHijriCalendar().monthGrid(1448, 5, { weekStartsOn: 1 });

    expect(grid.weeks[0]?.[0]?.hijri.day).toBe(1);
  });

  it("shifts with the Hijri Adjustment", () => {
    const grid = createHijriCalendar({ adjustment: -1 }).monthGrid(1448, 5);

    expect(grid.days[0]?.date).toStrictEqual(day("2026-10-13"));
  });

  it("steps across the year boundary", () => {
    expect(addHijriMonths({ year: 1447, month: 12 }, 1)).toStrictEqual({
      year: 1448,
      month: 1,
    });
    expect(addHijriMonths({ year: 1448, month: 1 }, -1)).toStrictEqual({
      year: 1447,
      month: 12,
    });
  });
});

/** Whether each [year, month, day] falls in the window. */
const inWindow = (window: HijriWindow, dates: [number, HijriMonth, number][]) =>
  dates.map(([year, month, date]) =>
    isInHijriWindow({ year, month, day: date }, window)
  );

describe("Hijri window", () => {
  it("includes both ends", () => {
    const ramadan: HijriWindow = {
      start: { month: 9, day: 1 },
      end: { month: 9, day: 30 },
    };

    expect(
      inWindow(ramadan, [
        [1447, 9, 1],
        [1447, 9, 30],
        [1447, 10, 1],
      ])
    ).toStrictEqual([true, true, false]);
  });

  it("spans the year boundary when it ends before it starts", () => {
    const hajjToAshura: HijriWindow = {
      start: { month: 12, day: 25 },
      end: { month: 1, day: 10 },
    };

    expect(
      inWindow(hajjToAshura, [
        [1447, 12, 24],
        [1447, 12, 25],
        [1448, 1, 1],
        [1448, 1, 10],
        [1448, 1, 11],
        [1447, 6, 1],
      ])
    ).toStrictEqual([false, true, true, true, false, false]);
  });
});
