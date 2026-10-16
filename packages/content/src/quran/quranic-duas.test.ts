import { describe, expect, it } from "vitest";

import {
  AYAT,
  QURANIC_DUA_ROWS,
  QURANIC_DUA_SPEAKERS,
  QURANIC_DUA_SUBJECTS,
} from ".";

const keys = new Set<string>(AYAT.map((ayah) => ayah.key));
const order = new Map(AYAT.map((ayah, index) => [ayah.key, index]));

describe("Quranic duas", () => {
  it("point at real ayat, within one surah, from first to last", () => {
    for (const [from, to] of QURANIC_DUA_ROWS) {
      expect(keys.has(from)).toBeTruthy();
      expect(keys.has(to)).toBeTruthy();
      expect(from.split(":")[0]).toBe(to.split(":")[0]);
      expect(order.get(from) ?? 0).toBeLessThanOrEqual(order.get(to) ?? -1);
    }
  });

  it("are in mushaf order, none repeated or overlapping", () => {
    let previousEnd = -1;
    for (const [from, to] of QURANIC_DUA_ROWS) {
      expect(order.get(from) ?? -1).toBeGreaterThan(previousEnd);
      previousEnd = order.get(to) ?? -1;
    }
  });

  it("use only known speakers and subjects, and use every one of them", () => {
    const speakers = new Set<string>(QURANIC_DUA_SPEAKERS);
    const subjects = new Set<string>(QURANIC_DUA_SUBJECTS);
    for (const row of QURANIC_DUA_ROWS) {
      expect(speakers.has(row[2])).toBeTruthy();
      expect(subjects.has(row[3])).toBeTruthy();
    }
    expect(new Set(QURANIC_DUA_ROWS.map((row) => row[2]))).toStrictEqual(
      speakers
    );
    expect(new Set(QURANIC_DUA_ROWS.map((row) => row[3]))).toStrictEqual(
      subjects
    );
  });

  it("each begin on a request to the Lord", () => {
    // Every dua's first ayah (or, where the ayah narrates first, the range)
    // addresses the Lord: رب / ربنا / اللهم / غفرانك / اهدنا / لا إله إلا أنت.
    const addresses =
      /رَبِّ|رَبَّنَا|رَّبِّ|رَّبَّنَا|رَبَّنَآ|رَّبَّنَآ|رَبِّۦ|ٱللَّهُمَّ|غُفۡرَانَكَ|ٱهۡدِنَا|أَن لَّآ إِلَٰهَ|سُبۡحَٰنَ ٱلَّذِي/u;
    for (const [from, to] of QURANIC_DUA_ROWS) {
      const text = AYAT.filter(
        (ayah) =>
          (order.get(ayah.key) ?? -1) >= (order.get(from) ?? 0) &&
          (order.get(ayah.key) ?? -1) <= (order.get(to) ?? -1)
      )
        .map((ayah) => ayah.text)
        .join(" ");
      expect(addresses.test(text)).toBeTruthy();
    }
  });
});
