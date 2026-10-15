import { createProgramsRepository } from "@alrisali/db-content/programs";
import type { OfficialProgram } from "@alrisali/domain/programs";
import { useQuery } from "@tanstack/react-query";

import {
  CONTENT_QUERY_KEY,
  getContentReplica,
} from "@/shared/lib/content-database";

// Every active Official Program from the content replica, in the Admins'
// order; empty until the first pull. Seasonal ones are filtered by the
// screens, which know today's Hijri Date.
const programsQuery = {
  queryKey: [...CONTENT_QUERY_KEY, "programs"],
  queryFn: async (): Promise<OfficialProgram[]> => {
    const replica = await getContentReplica();
    return createProgramsRepository(replica.db).list();
  },
};

export const useOfficialPrograms = () => useQuery(programsQuery);

/** One active Official Program, or null when there is none (or it is off). */
export const useOfficialProgram = (id: string) =>
  useQuery({
    ...programsQuery,
    select: (programs) => programs.find((program) => program.id === id) ?? null,
  });
