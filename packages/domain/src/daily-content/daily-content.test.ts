import { SUPPLICATION_IDS } from "@alrisali/content/books";
import { Temporal } from "temporal-polyfill";
import { describe, expect, it } from "vitest";

import {
  dailyContentSchema,
  todaysDailyContent,
  todaysWorship,
  WEEKDAYS,
  weekdayOf,
  worshipEntrySchema,
} from "./daily-content";

const day = (iso: string) => Temporal.PlainDate.from(iso);

describe("Daily Content", () => {
  it("names a day's weekday", () => {
    expect(weekdayOf(day("2026-10-15"))).toBe("thursday");
    expect(weekdayOf(day("2026-10-17"))).toBe("saturday");
    expect(weekdayOf(day("2026-10-18"))).toBe("sunday");
    expect(weekdayOf(day("2026-10-19"))).toBe("monday");
  });

  it("lists the seven weekdays from Saturday", () => {
    expect(WEEKDAYS).toStrictEqual([
      "saturday",
      "sunday",
      "monday",
      "tuesday",
      "wednesday",
      "thursday",
      "friday",
    ]);
  });

  it("accepts every Supplication id from the Books", () => {
    for (const supplicationId of SUPPLICATION_IDS) {
      expect(
        dailyContentSchema.safeParse({ weekday: "friday", supplicationId })
          .success
      ).toBeTruthy();
    }
  });

  it("refuses an id no Book has, and a day that is not a weekday", () => {
    for (const entry of [
      { weekday: "friday", supplicationId: "sahifa-999" },
      { weekday: "friday", supplicationId: "/mafatih/daily-supplications" },
      { weekday: "friday", supplicationId: "" },
      { weekday: "someday", supplicationId: "sahifa-1" },
    ]) {
      expect(dailyContentSchema.safeParse(entry).success).toBeFalsy();
    }
  });

  it("features today's Supplication", () => {
    const entries = [
      { weekday: "thursday", supplicationId: "mafatih-dua-kumayl" },
      { weekday: "friday", supplicationId: "sahifa-weekday-friday" },
    ] as const;

    expect(todaysDailyContent(entries, day("2026-10-15"))).toMatchObject({
      id: "mafatih-dua-kumayl",
      bookId: "mafatih",
    });
    expect(todaysDailyContent(entries, day("2026-10-16"))).toMatchObject({
      id: "sahifa-weekday-friday",
    });
  });

  it("features nothing on a weekday Admins left empty, or one whose id no Book has", () => {
    const entries = [{ weekday: "thursday", supplicationId: "gone" }];

    expect(todaysDailyContent(entries, day("2026-10-15"))).toBeUndefined();
    expect(todaysDailyContent(entries, day("2026-10-16"))).toBeUndefined();
  });
});

describe("Today's worship", () => {
  const entries = [
    {
      kind: "ziyarah",
      day: "thursday",
      supplicationId: "mafatih-ziyarat-ashura",
    },
    {
      kind: "night-dua",
      day: "thursday",
      supplicationId: "mafatih-dua-kumayl",
    },
    { kind: "every-day", day: "every", supplicationId: "mafatih-dua-sabah" },
    { kind: "night-dua", day: "thursday", supplicationId: "gone" },
  ];
  const weekdayDuas = [
    { weekday: "thursday", supplicationId: "sahifa-weekday-thursday" },
  ];
  const thursday = day("2026-10-15");

  it("offers the weekday's dua, ziyarah and every-day items before Maghrib", () => {
    const worship = todaysWorship({
      weekdayDuas,
      entries,
      today: thursday,
      afterMaghrib: false,
    });
    expect(worship.dua?.id).toBe("sahifa-weekday-thursday");
    expect(worship.ziyarah.map(({ id }) => id)).toStrictEqual([
      "mafatih-ziyarat-ashura",
    ]);
    expect(worship.everyDay.map(({ id }) => id)).toStrictEqual([
      "mafatih-dua-sabah",
    ]);
    expect(worship.tonight).toStrictEqual([]);
  });

  it("shows Kumayl as tonight's dua after Maghrib on Thursday, dropping unknown ids", () => {
    const worship = todaysWorship({
      weekdayDuas,
      entries,
      today: thursday,
      afterMaghrib: true,
    });
    expect(worship.tonight.map(({ id }) => id)).toStrictEqual([
      "mafatih-dua-kumayl",
    ]);
  });

  it("offers no night dua on a weekday without one", () => {
    const worship = todaysWorship({
      weekdayDuas,
      entries,
      today: day("2026-10-16"),
      afterMaghrib: true,
    });
    expect(worship.tonight).toStrictEqual([]);
    expect(worship.dua).toBeUndefined();
    expect(worship.everyDay).toHaveLength(1);
  });

  it("accepts every-day entries only without a weekday", () => {
    const entry = { kind: "every-day", supplicationId: "sahifa-1" };
    expect(
      worshipEntrySchema.safeParse({ ...entry, day: "every" }).success
    ).toBeTruthy();
    expect(
      worshipEntrySchema.safeParse({ ...entry, day: "friday" }).success
    ).toBeFalsy();
    expect(
      worshipEntrySchema.safeParse({
        kind: "ziyarah",
        day: "every",
        supplicationId: "sahifa-1",
      }).success
    ).toBeFalsy();
  });
});
