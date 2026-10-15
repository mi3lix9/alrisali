import {
  assertCanSubscribe,
  subscriptionSchema,
} from "@alrisali/domain/programs";
import type {
  SubscribedProgramKind,
  Subscription,
} from "@alrisali/domain/programs";
import { asc, eq } from "drizzle-orm";

import type { UserDb } from "../shared";
import { programSubscriptions } from "./schema";

export interface SubscriptionsRepository {
  /** The Believer's Subscriptions, oldest first, paused ones included. */
  list: () => Promise<Subscription[]>;
  /**
   * Subscribes to a Program. Throws `SubscriptionRefusedError` (already
   * subscribed, or the total, General or Seasonal limit reached).
   */
  subscribe: (program: {
    id: string;
    kind: SubscribedProgramKind;
  }) => Promise<Subscription>;
  /** Pauses a Subscription; it keeps counting towards the limits. */
  pause: (programId: string) => Promise<void>;
  resume: (programId: string) => Promise<void>;
  unsubscribe: (programId: string) => Promise<void>;
}

export const createSubscriptionsRepository = (
  db: UserDb,
  now: () => Date = () => new Date()
): SubscriptionsRepository => {
  const list = async (): Promise<Subscription[]> => {
    const rows = await db
      .select()
      .from(programSubscriptions)
      .orderBy(
        asc(programSubscriptions.subscribedAt),
        asc(programSubscriptions.id)
      );
    return rows.flatMap(({ id, programKind, paused, subscribedAt }) => {
      // A newer app may have synced a kind of Program this one does not know.
      const subscription = subscriptionSchema.safeParse({
        programId: id,
        programKind,
        paused,
        subscribedAt,
      });
      return subscription.success ? [subscription.data] : [];
    });
  };

  const setPaused = async (programId: string, paused: boolean) => {
    await db
      .update(programSubscriptions)
      .set({ paused })
      .where(eq(programSubscriptions.id, programId));
  };

  return {
    list,
    subscribe: async (program) => {
      assertCanSubscribe(await list(), program);
      const subscription = subscriptionSchema.parse({
        programId: program.id,
        programKind: program.kind,
        paused: false,
        subscribedAt: now().getTime(),
      });
      await db.insert(programSubscriptions).values({
        id: subscription.programId,
        programKind: subscription.programKind,
        paused: subscription.paused,
        subscribedAt: subscription.subscribedAt,
      });
      return subscription;
    },
    pause: (programId) => setPaused(programId, true),
    resume: (programId) => setPaused(programId, false),
    unsubscribe: async (programId) => {
      await db
        .delete(programSubscriptions)
        .where(eq(programSubscriptions.id, programId));
    },
  };
};
