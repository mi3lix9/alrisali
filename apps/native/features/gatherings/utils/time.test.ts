import { describe, expect, it } from "vitest";

import { formatTimeRange } from "./time";

describe(formatTimeRange, () => {
  it("writes the start and end in the language", () => {
    expect(
      formatTimeRange({ startTime: "19:30", endTime: "21:00" }, "en")
    ).toMatch(/^7:30\sPM – 9:00\sPM$/u);
  });

  it("writes only the start without an end time", () => {
    expect(
      formatTimeRange({ startTime: "08:05", endTime: null }, "en")
    ).toMatch(/^8:05\sAM$/u);
  });

  it("keeps Latin digits in Arabic", () => {
    expect(
      formatTimeRange({ startTime: "19:30", endTime: null }, "ar")
    ).toContain("7:30");
  });
});
