import { createCompanionRepository } from "@alrisali/db-user/companion";
import type { CompanionRepository } from "@alrisali/db-user/companion";
import { companionStage, levelReached } from "@alrisali/domain/companion";
import type {
  CompanionStage,
  CompanionTheme,
  XpEvent,
} from "@alrisali/domain/companion";
import { useMutation, useQuery } from "@tanstack/react-query";

import { queryClient } from "@/shared/lib/orpc";
import {
  getUserDatabase,
  USER_DATA_QUERY_KEY,
} from "@/shared/lib/user-database";

const COMPANION_QUERY_KEY = [...USER_DATA_QUERY_KEY, "companion"];

const companionRepository = async (): Promise<CompanionRepository> => {
  const { db } = await getUserDatabase();
  return createCompanionRepository(db);
};

/** The Companion's XP and theme. */
export const useCompanion = () =>
  useQuery({
    queryKey: COMPANION_QUERY_KEY,
    queryFn: async () => {
      const repository = await companionRepository();
      return repository.companion();
    },
  });

/** Changes how the Companion looks: a Garden or a Traveler. */
export const useSetCompanionTheme = () =>
  useMutation({
    mutationFn: async (theme: CompanionTheme) => {
      const repository = await companionRepository();
      await repository.setTheme(theme);
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: COMPANION_QUERY_KEY });
    },
  });

export interface LevelUp {
  level: number;
  stage: CompanionStage;
}

const award = async (event: XpEvent): Promise<LevelUp | null> => {
  const repository = await companionRepository();
  const { awarded, before, after } = await repository.award(event);
  if (!awarded) {
    return null;
  }
  await queryClient.invalidateQueries({ queryKey: COMPANION_QUERY_KEY });
  const level = levelReached(before, after);
  if (level === null) {
    return null;
  }
  const { theme } = await repository.companion();
  return { level, stage: companionStage(theme, level) };
};

let awarding: Promise<unknown> = Promise.resolve();

/**
 * Awards an event's XP (once per event, however often it is heard) and
 * resolves to the level-up it brought, or null. Awards run one at a time, so
 * each compares the totals it moved between.
 */
export const awardXp = (event: XpEvent): Promise<LevelUp | null> => {
  const previous = awarding;
  const current = (async () => {
    try {
      await previous;
    } catch {
      // The earlier award's caller handles its failure.
    }
    return award(event);
  })();
  awarding = current;
  return current;
};
