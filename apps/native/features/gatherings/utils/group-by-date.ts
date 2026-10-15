import type { Gathering } from "@alrisali/domain/gatherings";

export interface GatheringDateGroup {
  /** `YYYY-MM-DD`. */
  date: string;
  gatherings: Gathering[];
}

/** Consecutive Gatherings on the same date, in the order given (sort first). */
export const groupByDate = (
  gatherings: readonly Gathering[]
): GatheringDateGroup[] => {
  const groups: GatheringDateGroup[] = [];
  for (const gathering of gatherings) {
    const last = groups.at(-1);
    if (last?.date === gathering.date) {
      last.gatherings.push(gathering);
    } else {
      groups.push({ date: gathering.date, gatherings: [gathering] });
    }
  }
  return groups;
};
