import { describe, expect, it } from "vitest";

import { amalOfMonth } from "./amal";

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
