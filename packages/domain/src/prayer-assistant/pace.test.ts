import { describe, expect, it } from "vitest";

import { paceHolds } from "./pace";

describe(paceHolds, () => {
  it("holds each Position 0.8 s and confirms a Tashahhud after 3 s at Normal, as the old app did", () => {
    expect(paceHolds({ pace: "normal" })).toStrictEqual({
      positionMs: 800,
      risingMs: 450,
      tashahhudMs: 3000,
      finalTashahhudMs: 12_000,
    });
  });

  it("waits longer at Slow and less at Fast", () => {
    expect(paceHolds({ pace: "slow" })).toStrictEqual({
      positionMs: 1200,
      risingMs: 675,
      tashahhudMs: 4000,
      finalTashahhudMs: 18_000,
    });
    expect(paceHolds({ pace: "fast" })).toStrictEqual({
      positionMs: 500,
      risingMs: 281,
      tashahhudMs: 2000,
      finalTashahhudMs: 8000,
    });
  });

  it("uses a Custom Pace's own holds", () => {
    expect(
      paceHolds({ pace: "custom", custom: { holdMs: 1000, tashahhudMs: 3500 } })
    ).toStrictEqual({
      positionMs: 1000,
      risingMs: 563,
      tashahhudMs: 3500,
      finalTashahhudMs: 15_000,
    });
  });

  it("keeps a Custom Pace within the limits", () => {
    expect(
      paceHolds({ pace: "custom", custom: { holdMs: 10, tashahhudMs: 99_999 } })
    ).toStrictEqual({
      positionMs: 300,
      risingMs: 250,
      tashahhudMs: 8000,
      finalTashahhudMs: 18_000,
    });
  });

  it("never asks for a final Tashahhud shorter than 8 s", () => {
    expect(
      paceHolds({ pace: "custom", custom: { holdMs: 300, tashahhudMs: 1000 } })
        .finalTashahhudMs
    ).toBe(8000);
  });
});
