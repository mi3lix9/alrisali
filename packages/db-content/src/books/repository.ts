import type { AmalEntry } from "@alrisali/content/books";
import { and, eq } from "drizzle-orm";

import { isMissingTable } from "../shared/content-db";
import type { ContentDb } from "../shared/content-db";
import { amalEntries } from "./schema";

/** One act of a day, as Admins list it. */
export interface AmalAct {
  kind: AmalEntry["kind"];
  time?: "night" | "day" | undefined;
  supplicationId: string;
}

export interface AmalRepository {
  /**
   * Every A'mal entry, in a stable order, or null while the replica has never
   * pulled (the app then shows the index it bundled).
   */
  all: () => Promise<AmalEntry[] | null>;
  /** Replaces everything a day lists (day 0: the whole month); an empty list clears it. The server only. */
  replaceDay: (
    month: number,
    day: number,
    acts: readonly AmalAct[]
  ) => Promise<void>;
}

const toEntry = (row: typeof amalEntries.$inferSelect): AmalEntry => ({
  month: row.month,
  day: row.day,
  kind: row.kind as AmalEntry["kind"],
  ...(row.time === "night" || row.time === "day" ? { time: row.time } : {}),
  supplicationId: row.supplicationId,
});

export const createAmalRepository = (db: ContentDb): AmalRepository => ({
  all: async () => {
    try {
      const rows = await db.select().from(amalEntries);
      return rows
        .toSorted(
          (a, b) =>
            a.month - b.month ||
            a.day - b.day ||
            a.time.localeCompare(b.time) ||
            a.supplicationId.localeCompare(b.supplicationId)
        )
        .map(toEntry);
    } catch (error) {
      if (isMissingTable(error)) {
        return null;
      }
      throw error;
    }
  },
  replaceDay: async (month, day, acts) => {
    // One transaction: a failed insert never leaves the day empty.
    const remove = db
      .delete(amalEntries)
      .where(and(eq(amalEntries.month, month), eq(amalEntries.day, day)));
    if (acts.length === 0) {
      await db.batch([remove]);
      return;
    }
    await db.batch([
      remove,
      db.insert(amalEntries).values(
        acts.map(({ kind, time, supplicationId }) => ({
          month,
          day,
          kind,
          time: time ?? "",
          supplicationId,
        }))
      ),
    ]);
  },
});
