import { Temporal } from "temporal-polyfill";
import { describe, expect, it } from "vitest";

import { locationToday, moveShownDay } from "./day-navigation";

const today = Temporal.PlainDate.from("2026-10-15");

describe(locationToday, () => {
  it("is the day on the location's clock, not the device's", () => {
    const now = Temporal.Instant.from("2026-10-15T22:30:00Z");
    expect(locationToday(now, "Asia/Riyadh").toString()).toBe("2026-10-16");
    expect(locationToday(now, "America/New_York").toString()).toBe(
      "2026-10-15"
    );
  });
});

describe(moveShownDay, () => {
  it("steps forward from today to tomorrow", () => {
    expect(moveShownDay(null, today, 1)?.toString()).toBe("2026-10-16");
  });

  it("steps back from today to yesterday", () => {
    expect(moveShownDay(null, today, -1)?.toString()).toBe("2026-10-14");
  });

  it("returns to today, shown as no other day, when stepping onto it", () => {
    const yesterday = Temporal.PlainDate.from("2026-10-14");
    expect(moveShownDay(yesterday, today, 1)).toBeNull();
  });

  it("crosses a month end", () => {
    const shown = Temporal.PlainDate.from("2026-10-31");
    expect(moveShownDay(shown, today, 1)?.toString()).toBe("2026-11-01");
  });
});
