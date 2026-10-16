import { describe, expect, it } from "vitest";

import { AMAL, AMAL_KINDS, getSupplication } from ".";

const LONGEST_HIJRI_MONTH = 30;

describe("A'mal index integrity", () => {
  it("points every a'mal entry to an existing Supplication", () => {
    expect(AMAL.length).toBeGreaterThan(0);
    const missing = AMAL.filter(
      (entry) => getSupplication(entry.supplicationId) === undefined
    );
    expect(missing).toStrictEqual([]);
  });

  it("keys every entry by a Hijri month and a day, 0 being the whole month", () => {
    const outOfRange = AMAL.filter(
      ({ month, day }) =>
        !Number.isInteger(month) ||
        month < 1 ||
        month > 12 ||
        !Number.isInteger(day) ||
        day < 0 ||
        day > LONGEST_HIJRI_MONTH
    );
    expect(outOfRange).toStrictEqual([]);
  });

  it("gives every entry a known kind", () => {
    const known = new Set<string>(AMAL_KINDS);
    expect(AMAL.filter((entry) => !known.has(entry.kind))).toStrictEqual([]);
  });

  it("lists a Supplication at most once on the same day and time", () => {
    const keys = AMAL.map(
      (entry) =>
        `${entry.month}/${entry.day}/${entry.time ?? ""}/${entry.supplicationId}`
    );
    expect(new Set(keys).size).toBe(keys.length);
  });

  it("maps Ziyarat Ashura to the day of Ashura and Dua al-Iftitah to every night of Ramadan", () => {
    expect(AMAL).toContainEqual({
      month: 1,
      day: 10,
      kind: "ziyarah",
      supplicationId: "mafatih-ziyarat-ashura",
    });
    expect(AMAL).toContainEqual({
      month: 9,
      day: 0,
      kind: "dua",
      time: "night",
      supplicationId: "mafatih-dua-iftitah",
    });
  });
});
