import { useQuery } from "@tanstack/react-query";

import { orpc } from "@/shared/lib/orpc";

const RECITERS_STALE_MS = 24 * 60 * 60 * 1000;

/** The Quran Foundation reciters a Believer can pick. */
export const useReciters = () =>
  useQuery(orpc.quran.reciters.queryOptions({ staleTime: RECITERS_STALE_MS }));
