import { describe, expect, it } from "vitest";

import { counterProgress, tapCounter } from "./counter";

describe(tapCounter, () => {
  it("counts each tap", () => {
    expect(tapCounter(0)).toBe(1);
    expect(tapCounter(41)).toBe(42);
  });
});

describe(counterProgress, () => {
  it("reports the share of the target reached", () => {
    expect(counterProgress(25, 100)).toBe(0.25);
  });

  it("caps at complete but lets the count run past it", () => {
    expect(counterProgress(130, 100)).toBe(1);
    expect(tapCounter(130)).toBe(131);
  });
});
