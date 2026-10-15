import { createSeenProgramsRepository } from "@alrisali/db-user/programs";
import { useMutation, useQuery } from "@tanstack/react-query";

import { queryClient } from "@/shared/lib/orpc";
import {
  getUserDatabase,
  USER_DATA_QUERY_KEY,
} from "@/shared/lib/user-database";

const SEEN_PROGRAMS_QUERY_KEY = [...USER_DATA_QUERY_KEY, "seen-programs"];

/** The ids of the Programs the Believer has opened; undefined while loading. */
export const useSeenProgramIds = () =>
  useQuery({
    queryKey: SEEN_PROGRAMS_QUERY_KEY,
    queryFn: async (): Promise<Set<string>> => {
      const { db } = await getUserDatabase();
      return createSeenProgramsRepository(db).seenIds();
    },
  });

/** Records that the Believer opened a Program, clearing its badge. */
export const useMarkProgramSeen = () =>
  useMutation({
    mutationFn: async (programId: string): Promise<void> => {
      const { db } = await getUserDatabase();
      await createSeenProgramsRepository(db).markSeen(programId, new Date());
    },
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: SEEN_PROGRAMS_QUERY_KEY }),
  });
