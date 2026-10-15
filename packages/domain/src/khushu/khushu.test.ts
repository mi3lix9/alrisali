import { Temporal } from "temporal-polyfill";
import { describe, expect, it } from "vitest";

import {
  DEFAULT_KHUSHU_LEVEL,
  MAX_CUSTOM_DISTRACTION_LENGTH,
  rateKhushu,
} from "./khushu";

const TODAY = Temporal.PlainDate.from("2026-10-15");

const rating = {
  date: TODAY,
  salah: "maghrib",
  level: 6,
  distractions: [],
  customDistraction: null,
} as const;

describe(rateKhushu, () => {
  it("starts a new rating at 7 out of 10, as the old app did", () => {
    expect(DEFAULT_KHUSHU_LEVEL).toBe(7);
  });

  it("keeps the level, Salah and date the Believer chose", () => {
    expect(rateKhushu(rating, TODAY)).toStrictEqual({
      date: TODAY,
      salah: "maghrib",
      level: 6,
      distractions: [],
      customDistraction: null,
    });
  });

  it("accepts both ends of the 0 to 10 slider", () => {
    expect(rateKhushu({ ...rating, level: 0 }, TODAY).level).toBe(0);
    expect(rateKhushu({ ...rating, level: 10 }, TODAY).level).toBe(10);
  });

  it.each([-1, 11, 6.5, Number.NaN])("refuses a level of %s", (level) => {
    expect(() => rateKhushu({ ...rating, level }, TODAY)).toThrow(
      expect.objectContaining({ reason: "level" })
    );
  });

  it("lists picked Distractions once each, in the list's order", () => {
    expect(
      rateKhushu(
        {
          ...rating,
          distractions: ["fatigue", "mindWandering", "fatigue"],
        },
        TODAY
      ).distractions
    ).toStrictEqual(["mindWandering", "fatigue"]);
  });

  it("keeps a typed Distraction, trimmed", () => {
    expect(
      rateKhushu({ ...rating, customDistraction: "  The doorbell  " }, TODAY)
        .customDistraction
    ).toBe("The doorbell");
  });

  it("treats a blank typed Distraction as none", () => {
    expect(
      rateKhushu({ ...rating, customDistraction: "   " }, TODAY)
        .customDistraction
    ).toBeNull();
  });

  it("refuses a typed Distraction over the length limit", () => {
    expect(() =>
      rateKhushu(
        {
          ...rating,
          customDistraction: "x".repeat(MAX_CUSTOM_DISTRACTION_LENGTH + 1),
        },
        TODAY
      )
    ).toThrow(expect.objectContaining({ reason: "customDistraction" }));
  });

  it("rates a past date but not a future one", () => {
    const yesterday = TODAY.subtract({ days: 1 });
    expect(rateKhushu({ ...rating, date: yesterday }, TODAY).date).toBe(
      yesterday
    );
    expect(() =>
      rateKhushu({ ...rating, date: TODAY.add({ days: 1 }) }, TODAY)
    ).toThrow(expect.objectContaining({ reason: "futureDate" }));
  });
});
