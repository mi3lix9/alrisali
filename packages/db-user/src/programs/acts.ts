import { assertCanCompleteAct } from "@alrisali/domain/programs";
import { asc, eq } from "drizzle-orm";
import { Temporal } from "temporal-polyfill";

import type { UserDb } from "../shared";
import { actCompletions, seenPrograms } from "./schema";

/** The record that the Believer performed an Act on a date. */
export interface ActCompletion {
  programId: string;
  actId: string;
  date: Temporal.PlainDate;
}

export interface SetActCompleted {
  programId: string;
  actId: string;
  date: Temporal.PlainDate;
  /** True completes the Act for `date`, false undoes it. */
  completed: boolean;
  /** The Believer's local date; a later `date` is refused. */
  today: Temporal.PlainDate;
  /** When the Act was ticked. */
  at: Date;
}

export interface ActCompletionsRepository {
  /**
   * Completes an Act for a date, or undoes it. Throws `FutureActDateError`
   * for a date after `today`, saving nothing.
   */
  setCompleted: (change: SetActCompleted) => Promise<void>;
  /** Every Act Completion, oldest date first. */
  completions: () => Promise<ActCompletion[]>;
  /** The Act Completions on one date. */
  completionsOn: (date: Temporal.PlainDate) => Promise<ActCompletion[]>;
}

const readCompletions = (
  rows: { programId: string; actId: string; date: string }[]
): ActCompletion[] =>
  rows.map(({ programId, actId, date }) => ({
    programId,
    actId,
    date: Temporal.PlainDate.from(date),
  }));

export const createActCompletionsRepository = (
  db: UserDb
): ActCompletionsRepository => {
  const select = () =>
    db
      .select({
        programId: actCompletions.programId,
        actId: actCompletions.actId,
        date: actCompletions.date,
      })
      .from(actCompletions)
      .$dynamic();

  const order = [
    asc(actCompletions.date),
    asc(actCompletions.programId),
    asc(actCompletions.actId),
  ];

  return {
    setCompleted: async ({ programId, actId, date, completed, today, at }) => {
      assertCanCompleteAct(date, today);
      const day = date.toString();
      const id = `${programId}:${actId}:${day}`;
      await (completed
        ? db
            .insert(actCompletions)
            .values({ id, programId, actId, date: day, completedAt: at })
            .onConflictDoNothing()
        : db.delete(actCompletions).where(eq(actCompletions.id, id)));
    },
    completions: async () => readCompletions(await select().orderBy(...order)),
    completionsOn: async (date) =>
      readCompletions(
        await select()
          .where(eq(actCompletions.date, date.toString()))
          .orderBy(...order)
      ),
  };
};

export interface SeenProgramsRepository {
  /** The ids of the Programs the Believer has opened. */
  seenIds: () => Promise<Set<string>>;
  /** Records that the Believer opened a Program; again is a no-op. */
  markSeen: (programId: string, at: Date) => Promise<void>;
}

export const createSeenProgramsRepository = (
  db: UserDb
): SeenProgramsRepository => ({
  seenIds: async () => {
    const rows = await db.select({ id: seenPrograms.id }).from(seenPrograms);
    return new Set(rows.map(({ id }) => id));
  },
  markSeen: async (programId, at) => {
    await db
      .insert(seenPrograms)
      .values({ id: programId, seenAt: at })
      .onConflictDoNothing();
  },
});
