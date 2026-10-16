import type { ReactNode } from "react";

import { useWorshipMapping } from "../data/worship-mapping";

/** One entry of the worship mapping, as the content replica holds it. */
export interface WorshipEntry {
  kind: string;
  day: string;
  supplicationId: string;
}

/**
 * Hands the worship mapping to `children` (undefined while it loads, empty
 * when it cannot be read), so the root route can pass it to the Reminder
 * scheduler for the ziyarah Reminder.
 */
export const WorshipMappingPlans = ({
  children,
}: {
  children: (entries: readonly WorshipEntry[] | undefined) => ReactNode;
}) => {
  const { data, isPending } = useWorshipMapping();
  return children(isPending ? undefined : (data ?? []));
};
