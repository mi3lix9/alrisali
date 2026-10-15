import { z } from "zod";

import { PROGRAM_CATEGORIES } from "./program";
import type { ProgramCategory } from "./program";

/** What a Subscription is to: an Official General or Seasonal Program, or a Personal one. */
export const SUBSCRIBED_PROGRAM_KINDS = [
  ...PROGRAM_CATEGORIES,
  "personal",
] as const;

export type SubscribedProgramKind = (typeof SUBSCRIBED_PROGRAM_KINDS)[number];

/** A Believer's enrolment in a Program, which they may pause. */
export const subscriptionSchema = z.object({
  programId: z.string().trim().min(1),
  programKind: z.enum(SUBSCRIBED_PROGRAM_KINDS),
  paused: z.boolean(),
  /** Milliseconds since the epoch. */
  subscribedAt: z.number().int().nonnegative(),
});

export type Subscription = z.output<typeof subscriptionSchema>;

/**
 * How many Subscriptions a Believer may hold: five in all, of which one
 * General and one Seasonal Official Program. Paused ones count, so resuming
 * never breaks a limit.
 */
export const SUBSCRIPTION_LIMITS = {
  total: 5,
  general: 1,
  seasonal: 1,
} as const;

export const SUBSCRIPTION_REFUSALS = [
  "already-subscribed",
  "not-creator",
  "maximum-programs",
  "maximum-general",
  "maximum-seasonal",
] as const;

export type SubscriptionRefusal = (typeof SUBSCRIPTION_REFUSALS)[number];

/** Raised when a Subscription would break a rule; `reason` says which. */
export class SubscriptionRefusedError extends Error {
  readonly reason: SubscriptionRefusal;
  /** The limit reached; null when already subscribed. */
  readonly limit: number | null;

  constructor(reason: SubscriptionRefusal, limit: number | null = null) {
    super(`Subscription refused: ${reason}`);
    this.name = "SubscriptionRefusedError";
    this.reason = reason;
    this.limit = limit;
  }
}

/**
 * The Program a Believer asks to subscribe to. A Personal Program says
 * whether this Believer built it: only its creator may subscribe.
 */
export type SubscriptionTarget =
  | { id: string; kind: ProgramCategory }
  | { id: string; kind: "personal"; ownedByBeliever: boolean };

/**
 * Checks that the Believer, holding `subscriptions`, may subscribe to
 * `program`; throws `SubscriptionRefusedError` otherwise.
 */
export const assertCanSubscribe = (
  subscriptions: readonly Pick<Subscription, "programId" | "programKind">[],
  program: SubscriptionTarget
): void => {
  if (program.kind === "personal" && !program.ownedByBeliever) {
    throw new SubscriptionRefusedError("not-creator");
  }
  if (subscriptions.some(({ programId }) => programId === program.id)) {
    throw new SubscriptionRefusedError("already-subscribed");
  }
  if (subscriptions.length >= SUBSCRIPTION_LIMITS.total) {
    throw new SubscriptionRefusedError(
      "maximum-programs",
      SUBSCRIPTION_LIMITS.total
    );
  }
  if (program.kind === "personal") {
    return;
  }
  const limit = SUBSCRIPTION_LIMITS[program.kind];
  const held = subscriptions.filter(
    ({ programKind }) => programKind === program.kind
  ).length;
  if (held >= limit) {
    throw new SubscriptionRefusedError(
      program.kind === "general" ? "maximum-general" : "maximum-seasonal",
      limit
    );
  }
};
