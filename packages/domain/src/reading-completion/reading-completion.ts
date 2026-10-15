import { z } from "zod";

/** A calendar day, `YYYY-MM-DD`. */
const readingDateSchema = z.iso.date();

/** The Believer's record that they read a Supplication on a given day. */
export const readingCompletionSchema = z.object({
  supplicationId: z.string().trim().min(1),
  date: readingDateSchema,
});

export type ReadingCompletion = z.infer<typeof readingCompletionSchema>;

const pad = (value: number): string => String(value).padStart(2, "0");

/** The Believer's local calendar day at `now`, `YYYY-MM-DD`. */
export const readingDate = (now: Date): string =>
  `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;

/**
 * The completion's row id. Derived from the Supplication and the day, so
 * marking it read on two devices the same day makes one Reading Completion.
 */
export const readingCompletionId = ({
  supplicationId,
  date,
}: ReadingCompletion): string => `${supplicationId}@${date}`;
