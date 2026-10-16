import type { Temporal } from "temporal-polyfill";

import type { InsightsSources } from "../shared";

/** A Khatmah the Believer finished. */
export interface CompletedKhatmahInsight {
  khatmahId: string;
  startDate: Temporal.PlainDate;
  completedOn: Temporal.PlainDate;
  /** Days from its start to its last session, both included. */
  days: number;
  sessions: number;
}

/** One bar of the per-session chart. */
export interface KhatmahSessionBar {
  session: number;
  date: Temporal.PlainDate;
  pages: number;
}

export interface KhatmahInsights {
  /** Finished Khatmahs, the latest first. */
  completed: CompletedKhatmahInsight[];
  /** The newest Khatmah's completed sessions, in order; empty without one. */
  chart: KhatmahSessionBar[];
}

/** The finished Khatmahs and the per-session chart of the newest Khatmah. */
export const khatmahInsights = (sources: InsightsSources): KhatmahInsights => {
  const completed = sources.khatmahs
    .flatMap((khatmah) =>
      khatmah.completedOn
        ? [
            {
              khatmahId: khatmah.id,
              startDate: khatmah.startDate,
              completedOn: khatmah.completedOn,
              days:
                khatmah.startDate.until(khatmah.completedOn, {
                  largestUnit: "days",
                }).days + 1,
              sessions: khatmah.sessions.length,
            },
          ]
        : []
    )
    .toSorted(
      (a, b) =>
        b.completedOn.toString().localeCompare(a.completedOn.toString()) ||
        a.khatmahId.localeCompare(b.khatmahId)
    );
  const newest = sources.khatmahs.at(-1);
  return {
    completed,
    chart: (newest?.sessions ?? []).map(({ session, date, pages }) => ({
      session,
      date,
      pages,
    })),
  };
};
