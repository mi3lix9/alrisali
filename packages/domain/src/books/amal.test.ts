import { AMAL_KINDS } from "@alrisali/content/books";
import { describe, expect, it } from "vitest";

import { AMAL_KIND_NAMES, amalDaySchema, amalOfMonth } from "./amal";

describe(amalOfMonth, () => {
  it("lists the acts of every day of the month apart from those of a specific day", () => {
    const ramadan = amalOfMonth(9);
    expect(ramadan.wholeMonth.map((entry) => entry.supplicationId)).toContain(
      "mafatih-dua-iftitah"
    );
    expect(ramadan.days.map(({ day }) => day)).not.toContain(0);
  });

  it("groups a month's specific acts by day, in the order of the days", () => {
    const dhuAlHijja = amalOfMonth(12);
    const days = dhuAlHijja.days.map(({ day }) => day);
    expect(days).toStrictEqual(days.toSorted((a, b) => a - b));
    expect(days).toContain(18);
    expect(
      dhuAlHijja.days
        .find(({ day }) => day === 10)
        ?.entries.map((entry) => entry.supplicationId)
    ).toStrictEqual(["sahifa-48", "mafatih-dua-nudba"]);
  });

  it("shows Ziyarat Ashura on the 10th of Muharram only", () => {
    const muharram = amalOfMonth(1);
    const ashura = muharram.days.filter(({ entries }) =>
      entries.some((entry) => entry.supplicationId === "mafatih-ziyarat-ashura")
    );
    expect(ashura.map(({ day }) => day)).toStrictEqual([10]);
    expect(muharram.wholeMonth).toStrictEqual([]);
  });

  it("reads from the a'mal it is given", () => {
    expect(
      amalOfMonth(7, [
        { month: 7, day: 27, kind: "fast", supplicationId: "x-b" },
        { month: 7, day: 0, kind: "tasbih", supplicationId: "x-a" },
        { month: 7, day: 1, kind: "prayer", supplicationId: "x-c" },
        { month: 8, day: 1, kind: "dua", supplicationId: "x-d" },
      ])
    ).toStrictEqual({
      wholeMonth: [{ month: 7, day: 0, kind: "tasbih", supplicationId: "x-a" }],
      days: [
        {
          day: 1,
          entries: [
            { month: 7, day: 1, kind: "prayer", supplicationId: "x-c" },
          ],
        },
        {
          day: 27,
          entries: [{ month: 7, day: 27, kind: "fast", supplicationId: "x-b" }],
        },
      ],
    });
  });
});

describe("A'mal day input", () => {
  it("accepts a day's acts that name bundled Supplications", () => {
    expect(
      amalDaySchema.safeParse({
        month: 9,
        day: 0,
        acts: [
          { kind: "dua", time: "night", supplicationId: "mafatih-dua-iftitah" },
        ],
      }).success
    ).toBeTruthy();
  });

  it("refuses an unknown Supplication, a day out of range and a repeated act", () => {
    const act = { kind: "dua", supplicationId: "mafatih-dua-iftitah" };
    expect(
      amalDaySchema.safeParse({
        month: 9,
        day: 1,
        acts: [{ kind: "dua", supplicationId: "sahifa-999" }],
      }).success
    ).toBeFalsy();
    expect(
      amalDaySchema.safeParse({ month: 13, day: 1, acts: [] }).success
    ).toBeFalsy();
    expect(
      amalDaySchema.safeParse({ month: 1, day: 31, acts: [] }).success
    ).toBeFalsy();
    expect(
      amalDaySchema.safeParse({ month: 1, day: 1, acts: [act, act] }).success
    ).toBeFalsy();
  });

  it("knows the same kinds as the bundled index", () => {
    expect([...AMAL_KIND_NAMES]).toStrictEqual([...AMAL_KINDS]);
  });
});
