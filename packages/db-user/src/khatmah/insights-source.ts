import { khatmahDoneSessions, khatmahSessions } from "@alrisali/domain/khatmah";
import type { KhatmahSource } from "@alrisali/domain/shared";
import { Temporal } from "temporal-polyfill";

import type { InsightsSourceReader } from "../shared";
import { createKhatmahRepository } from "./repository";

/**
 * Every Khatmah as Insights read it, oldest first: finished once each of its
 * sessions has a log, then completed on the date of the last one.
 */
export const readKhatmahInsightsSource: InsightsSourceReader<
  KhatmahSource
> = async (db) => {
  const repository = createKhatmahRepository(db);
  const [khatmahs, logs] = await Promise.all([
    repository.list(),
    repository.logs(),
  ]);
  return khatmahs.map((khatmah) => {
    const sessions = khatmahSessions(khatmah, logs);
    const done = khatmahDoneSessions(khatmah, logs);
    const dates = new Map(
      logs
        .filter(({ khatmahId }) => khatmahId === khatmah.id)
        .map(({ session, date }) => [session, date])
    );
    const read = sessions.flatMap((session) => {
      const date = dates.get(session.number);
      return done.has(session.number) && date
        ? [{ session: session.number, date, pages: session.pages }]
        : [];
    });
    const [last] = read
      .map(({ date }) => date)
      .toSorted((a, b) => Temporal.PlainDate.compare(b, a));
    return {
      id: khatmah.id,
      startDate: khatmah.startDate,
      completedOn: done.size === sessions.length && last ? last : null,
      sessions: read,
    };
  });
};
