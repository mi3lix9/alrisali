import { createSubscriptionsRepository } from "@alrisali/db-user/programs";
import type { SubscriptionsRepository } from "@alrisali/db-user/programs";
import type {
  SubscribedProgramKind,
  Subscription,
} from "@alrisali/domain/programs";
import { useMutation, useQuery } from "@tanstack/react-query";

import { queryClient } from "@/shared/lib/orpc";
import {
  getUserDatabase,
  USER_DATA_QUERY_KEY,
} from "@/shared/lib/user-database";

const SUBSCRIPTIONS_QUERY_KEY = [...USER_DATA_QUERY_KEY, "subscriptions"];

const subscriptions = async (): Promise<SubscriptionsRepository> => {
  const { db } = await getUserDatabase();
  return createSubscriptionsRepository(db);
};

const refresh = () =>
  queryClient.invalidateQueries({ queryKey: SUBSCRIPTIONS_QUERY_KEY });

/** The Believer's Subscriptions, oldest first, paused ones included. */
export const useSubscriptions = () =>
  useQuery({
    queryKey: SUBSCRIPTIONS_QUERY_KEY,
    queryFn: async (): Promise<Subscription[]> => {
      const repository = await subscriptions();
      return repository.list();
    },
  });

/**
 * Subscribes to a Program. A refused Subscription fails with
 * `SubscriptionRefusedError`, whose `reason` the screen explains.
 */
export const useSubscribe = () =>
  useMutation({
    mutationFn: async (program: {
      id: string;
      kind: SubscribedProgramKind;
    }): Promise<Subscription> => {
      const repository = await subscriptions();
      return repository.subscribe(program);
    },
    onSuccess: refresh,
  });

/** Pauses or resumes a Subscription. */
export const useSetSubscriptionPaused = () =>
  useMutation({
    mutationFn: async ({
      programId,
      paused,
    }: {
      programId: string;
      paused: boolean;
    }) => {
      const repository = await subscriptions();
      await (paused
        ? repository.pause(programId)
        : repository.resume(programId));
    },
    onSuccess: refresh,
  });

export const useUnsubscribe = () =>
  useMutation({
    mutationFn: async (programId: string) => {
      const repository = await subscriptions();
      await repository.unsubscribe(programId);
    },
    onSuccess: refresh,
  });
