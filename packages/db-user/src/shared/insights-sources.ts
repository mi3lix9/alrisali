import type { InsightsSources } from "@alrisali/domain/shared";
import { Temporal } from "temporal-polyfill";

import type { UserDb } from "./user-database";

/*
 * The read boundary between Insights and the features they aggregate.
 * Insights own no table and import no feature: each feature that records a
 * source reads its own tables in `src/<feature>/insights-source.ts`, and a
 * route passes those readers to Insights as `InsightsSourceReaders`.
 */

/**
 * Reads one source from the feature's own tables, oldest first. Moments
 * (check-ins, Dhikr Sessions, Habit creation) become dates in `timeZone`,
 * the Believer's. Rows a newer app wrote that this one cannot read are
 * skipped, as the feature's own repository does.
 */
export type InsightsSourceReader<Row> = (
  db: UserDb,
  timeZone: string
) => Promise<readonly Row[]>;

/** One reader per source Insights are computed from. */
export type InsightsSourceReaders = {
  [Source in keyof InsightsSources]: InsightsSourceReader<
    InsightsSources[Source][number]
  >;
};

/** The date an epoch-millisecond moment falls on in `timeZone`. */
export const localDateOf = (
  epochMs: number,
  timeZone: string
): Temporal.PlainDate =>
  Temporal.Instant.fromEpochMilliseconds(epochMs)
    .toZonedDateTimeISO(timeZone)
    .toPlainDate();
