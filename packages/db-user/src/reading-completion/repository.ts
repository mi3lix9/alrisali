import {
  readingCompletionId,
  readingCompletionSchema,
} from "@alrisali/domain/reading-completion";
import type { ReadingCompletion } from "@alrisali/domain/reading-completion";
import { eq } from "drizzle-orm";

import type { UserDb } from "../shared";
import { readingCompletions } from "./schema";

export interface ReadingCompletionsRepository {
  isRead: (completion: ReadingCompletion) => Promise<boolean>;
  /** Records the reading; a second mark the same day changes nothing. */
  markRead: (completion: ReadingCompletion) => Promise<void>;
  /** Undoes a mark made by mistake. */
  unmarkRead: (completion: ReadingCompletion) => Promise<void>;
  /** The ids of the Supplications read on `date`, in id order. */
  readOn: (date: string) => Promise<string[]>;
}

export const createReadingCompletionsRepository = (
  db: UserDb,
  now: () => Date = () => new Date()
): ReadingCompletionsRepository => {
  const isRead = async (completion: ReadingCompletion): Promise<boolean> => {
    const row = await db
      .select({ id: readingCompletions.id })
      .from(readingCompletions)
      .where(
        eq(
          readingCompletions.id,
          readingCompletionId(readingCompletionSchema.parse(completion))
        )
      )
      .get();
    return row !== undefined;
  };

  const markRead = async (completion: ReadingCompletion): Promise<void> => {
    const parsed = readingCompletionSchema.parse(completion);
    await db
      .insert(readingCompletions)
      .values({
        id: readingCompletionId(parsed),
        ...parsed,
        completedAt: now().toISOString(),
      })
      .onConflictDoNothing({ target: readingCompletions.id });
  };

  const unmarkRead = async (completion: ReadingCompletion): Promise<void> => {
    await db
      .delete(readingCompletions)
      .where(
        eq(
          readingCompletions.id,
          readingCompletionId(readingCompletionSchema.parse(completion))
        )
      );
  };

  const readOn = async (date: string): Promise<string[]> => {
    const day = readingCompletionSchema.shape.date.parse(date);
    const rows = await db
      .selectDistinct({ supplicationId: readingCompletions.supplicationId })
      .from(readingCompletions)
      .where(eq(readingCompletions.date, day))
      .orderBy(readingCompletions.supplicationId);
    return rows.map((row) => row.supplicationId);
  };

  return { isRead, markRead, unmarkRead, readOn };
};
