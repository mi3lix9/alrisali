import { describe, expect, it } from "vitest";

import {
  assertCanSubscribe,
  SUBSCRIPTION_LIMITS,
  SubscriptionRefusedError,
} from "./subscription";
import type { SubscribedProgramKind, Subscription } from "./subscription";

const held = (
  programId: string,
  programKind: SubscribedProgramKind,
  paused = false
): Subscription => ({ programId, programKind, paused, subscribedAt: 0 });

const refusalOf = (
  subscriptions: readonly Subscription[],
  program: { id: string; kind: SubscribedProgramKind }
) => {
  try {
    assertCanSubscribe(subscriptions, program);
    return null;
  } catch (error) {
    if (error instanceof SubscriptionRefusedError) {
      return { reason: error.reason, limit: error.limit };
    }
    throw error;
  }
};

describe("Subscription limits", () => {
  it("lets a Believer with nothing subscribe to any Program", () => {
    for (const kind of ["general", "seasonal", "personal"] as const) {
      expect(refusalOf([], { id: "p", kind })).toBeNull();
    }
  });

  it("refuses a second Subscription to the same Program", () => {
    expect(
      refusalOf([held("ramadan", "seasonal")], {
        id: "ramadan",
        kind: "seasonal",
      })
    ).toStrictEqual({ reason: "already-subscribed", limit: null });
  });

  it("refuses a second General Official Program", () => {
    expect(
      refusalOf([held("daily-nawafil", "general")], {
        id: "morning-adhkar",
        kind: "general",
      })
    ).toStrictEqual({ reason: "maximum-general", limit: 1 });
  });

  it("refuses a second Seasonal Official Program", () => {
    expect(
      refusalOf([held("muharram", "seasonal")], {
        id: "ramadan",
        kind: "seasonal",
      })
    ).toStrictEqual({ reason: "maximum-seasonal", limit: 1 });
  });

  it("allows one General and one Seasonal together", () => {
    expect(
      refusalOf([held("daily-nawafil", "general")], {
        id: "ramadan",
        kind: "seasonal",
      })
    ).toBeNull();
  });

  it("refuses a sixth Subscription of any kind", () => {
    const five = [
      held("daily-nawafil", "general"),
      held("ramadan", "seasonal"),
      held("mine-1", "personal"),
      held("mine-2", "personal"),
      held("mine-3", "personal"),
    ];
    expect(five).toHaveLength(SUBSCRIPTION_LIMITS.total);

    expect(refusalOf(five, { id: "mine-4", kind: "personal" })).toStrictEqual({
      reason: "maximum-programs",
      limit: 5,
    });
    expect(
      refusalOf(five.slice(0, 4), { id: "mine-4", kind: "personal" })
    ).toBeNull();
  });

  it("counts paused Subscriptions, so resuming never breaks a limit", () => {
    expect(
      refusalOf([held("daily-nawafil", "general", true)], {
        id: "morning-adhkar",
        kind: "general",
      })
    ).toStrictEqual({ reason: "maximum-general", limit: 1 });
  });

  it("reports the total limit before a category limit", () => {
    const five = [
      held("daily-nawafil", "general"),
      ...["1", "2", "3", "4"].map((n) => held(`mine-${n}`, "personal")),
    ];
    expect(refusalOf(five, { id: "other", kind: "general" })).toStrictEqual({
      reason: "maximum-programs",
      limit: 5,
    });
  });

  it("raises a typed error", () => {
    expect(() =>
      assertCanSubscribe([held("p", "general")], { id: "p", kind: "general" })
    ).toThrow(SubscriptionRefusedError);
  });
});
