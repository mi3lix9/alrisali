import { describe, expect, it } from "vitest";

import { GUEST_NUDGE_THRESHOLD, shouldNudgeGuest } from "./guest-nudge";

describe(shouldNudgeGuest, () => {
  it("stays quiet until the Guest has recorded enough to lose", () => {
    expect(
      shouldNudgeGuest({
        records: GUEST_NUDGE_THRESHOLD - 1,
        dismissedAt: null,
      })
    ).toBeFalsy();
  });

  it("nudges once the Guest's records reach the threshold", () => {
    expect(
      shouldNudgeGuest({ records: GUEST_NUDGE_THRESHOLD, dismissedAt: null })
    ).toBeTruthy();
  });

  it("stays dismissed until the threshold of new records since then", () => {
    expect(
      shouldNudgeGuest({
        records: 40 + GUEST_NUDGE_THRESHOLD - 1,
        dismissedAt: 40,
      })
    ).toBeFalsy();
    expect(
      shouldNudgeGuest({ records: 40 + GUEST_NUDGE_THRESHOLD, dismissedAt: 40 })
    ).toBeTruthy();
  });

  it("counts from zero again when the device holds fewer records than at dismissal", () => {
    expect(shouldNudgeGuest({ records: 3, dismissedAt: 40 })).toBeFalsy();
    expect(
      shouldNudgeGuest({ records: GUEST_NUDGE_THRESHOLD, dismissedAt: 40 })
    ).toBeTruthy();
  });
});
