import { describe, expect, it } from "vitest";

import {
  AYAT,
  QURANIC_DUA_ROWS,
  QURANIC_DUA_SPEAKERS,
  QURANIC_DUA_SUBJECTS,
} from ".";

const keys = new Set<string>(AYAT.map((ayah) => ayah.key));
const order = new Map(AYAT.map((ayah, index) => [ayah.key, index]));

/** Text without marks and with one letter form for each letter. */
const bare = (text: string) =>
  text
    .replaceAll(/[\u0640\u064B-\u065F\u0670\u06D6-\u06ED]/gu, "")
    .replaceAll(/[\u0671\u0622\u0623\u0625]/gu, "\u0627");

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

  it("each address the Lord, in the words the Quran gives", () => {
    // Without marks and letter forms: "O my Lord" / "our Lord", "O Allah",
    // "your forgiveness", "guide us", "there is no god but You".
    const addresses =
      /\u0631\u0628|\u0627\u0644\u0644\u0647\u0645|\u063A\u0641\u0631\u0627\u0646\u0643|\u0627\u0647\u062F\u0646\u0627|\u0644\u0627 \u0627\u0644\u0647 \u0627\u0644\u0627 \u0627\u0646\u062A/u;
    for (const [from, to] of QURANIC_DUA_ROWS) {
      const text = AYAT.filter(
        (ayah) =>
          (order.get(ayah.key) ?? -1) >= (order.get(from) ?? 0) &&
          (order.get(ayah.key) ?? -1) <= (order.get(to) ?? -1)
      )
        .map((ayah) => bare(ayah.text))
        .join(" ");
      expect(addresses.test(text)).toBeTruthy();
    }
  });
});
