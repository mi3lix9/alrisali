import {
  createPersonalProgramsRepository,
  createSubscriptionsRepository,
} from "@alrisali/db-user/programs";
import type { PersonalProgramsRepository } from "@alrisali/db-user/programs";
import { SubscriptionRefusedError } from "@alrisali/domain/programs";
import type {
  PersonalProgram,
  PersonalProgramInput,
} from "@alrisali/domain/programs";
import { useMutation, useQuery } from "@tanstack/react-query";

import { queryClient } from "@/shared/lib/orpc";
import {
  getUserDatabase,
  USER_DATA_QUERY_KEY,
} from "@/shared/lib/user-database";

import { SUBSCRIPTIONS_QUERY_KEY } from "./subscriptions";

const PERSONAL_PROGRAMS_QUERY_KEY = [
  ...USER_DATA_QUERY_KEY,
  "personal-programs",
];

const personalPrograms = async (): Promise<PersonalProgramsRepository> => {
  const { db } = await getUserDatabase();
  return createPersonalProgramsRepository(db);
};

const refresh = () =>
  Promise.all([
    queryClient.invalidateQueries({ queryKey: PERSONAL_PROGRAMS_QUERY_KEY }),
    queryClient.invalidateQueries({ queryKey: SUBSCRIPTIONS_QUERY_KEY }),
  ]);

const personalProgramsQuery = {
  queryKey: PERSONAL_PROGRAMS_QUERY_KEY,
  queryFn: async (): Promise<PersonalProgram[]> => {
    const repository = await personalPrograms();
    return repository.list();
  },
};

/** The Personal Programs the Believer built, oldest first. */
export const usePersonalPrograms = () => useQuery(personalProgramsQuery);

/** One Personal Program, or null when there is none. */
export const usePersonalProgram = (id: string) =>
  useQuery({
    ...personalProgramsQuery,
    select: (programs) => programs.find((program) => program.id === id) ?? null,
  });

export interface SavedPersonalProgram {
  program: PersonalProgram;
  /** Why a new Program could not be subscribed to; null when it was, or for an edit. */
  refusal: SubscriptionRefusedError | null;
}

/**
 * Saves a Personal Program, new or edited. A new one is subscribed to at
 * once; a refused Subscription (a limit reached) leaves it saved, and the
 * refusal is returned for the screen to explain.
 */
export const useSavePersonalProgram = () =>
  useMutation({
    mutationFn: async ({
      program,
      isNew,
    }: {
      program: PersonalProgramInput;
      isNew: boolean;
    }): Promise<SavedPersonalProgram> => {
      const { db } = await getUserDatabase();
      const saved = await createPersonalProgramsRepository(db).save(
        program,
        new Date()
      );
      if (!isNew) {
        return { program: saved, refusal: null };
      }
      try {
        await createSubscriptionsRepository(db).subscribe({
          id: saved.id,
          kind: "personal",
        });
        return { program: saved, refusal: null };
      } catch (error) {
        if (error instanceof SubscriptionRefusedError) {
          return { program: saved, refusal: error };
        }
        throw error;
      }
    },
    onSettled: refresh,
  });

/** Deletes a Personal Program and the Subscription to it. */
export const useRemovePersonalProgram = () =>
  useMutation({
    mutationFn: async (id: string): Promise<void> => {
      const repository = await personalPrograms();
      await repository.remove(id);
    },
    onSettled: refresh,
  });
