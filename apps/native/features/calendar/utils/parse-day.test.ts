import { Temporal } from "temporal-polyfill";
import { describe, expect, it } from "vitest";

import { parseDay } from "./parse-day";

describe(parseDay, () => {
  it("reads the day a link opens the calendar at", () => {
    expect(parseDay("2026-10-15")).toStrictEqual(
      Temporal.PlainDate.from("2026-10-15")
    );
  });

  it("ignores a missing or malformed day", () => {
    expect(parseDay()).toBeNull();
    expect(parseDay("")).toBeNull();
    expect(parseDay("2026-02-30")).toBeNull();
    expect(parseDay("tomorrow")).toBeNull();
  });
});
