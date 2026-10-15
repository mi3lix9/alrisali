import { describe, expect, it } from "vitest";

import { formatDuration } from "./format-duration";

describe(formatDuration, () => {
  it.each([
    [0, "0:00"],
    [9.6, "0:09"],
    [75, "1:15"],
    [3600, "1:00:00"],
    [3725.2, "1:02:05"],
  ])("shows %s seconds as %s", (seconds, shown) => {
    expect(formatDuration(seconds)).toBe(shown);
  });

  it("shows an unknown length as zero", () => {
    expect(formatDuration(Number.NaN)).toBe("0:00");
  });
});
