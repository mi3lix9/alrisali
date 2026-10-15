import { MOODS, moodSchema, remedyById } from "@alrisali/domain/mood";
import type { Mood } from "@alrisali/domain/mood";
import { desc, inArray } from "drizzle-orm";
import { z } from "zod";

import type { UserDb } from "../shared";
import { moodCheckIns } from "./schema";

export interface MoodCheckIn {
  /** A uuid, so check-ins made on different devices never collide. */
  id: string;
  mood: Mood;
  remedyId: string;
  checkedInAt: Date;
}

export interface MoodCheckInRepository {
  /** Validates and saves a check-in, then returns it. */
  record: (checkIn: MoodCheckIn) => Promise<MoodCheckIn>;
  /** The most recent check-in with a mood this app knows, or null. */
  latest: () => Promise<MoodCheckIn | null>;
}

const checkInSchema = z
  .object({
    id: z.uuid(),
    mood: moodSchema,
    remedyId: z.string(),
    checkedInAt: z.date(),
  })
  .refine(({ mood, remedyId }) => remedyById(remedyId)?.mood === mood, {
    message: "The remedy must be one offered for the mood",
    path: ["remedyId"],
  });

export const createMoodCheckInRepository = (
  db: UserDb
): MoodCheckInRepository => ({
  record: async (checkIn) => {
    const parsed = checkInSchema.parse(checkIn);
    await db.insert(moodCheckIns).values(parsed);
    return parsed;
  },
  latest: async () => {
    // A newer app may have synced a mood this one cannot show.
    const row = await db
      .select()
      .from(moodCheckIns)
      .where(inArray(moodCheckIns.mood, MOODS))
      .orderBy(desc(moodCheckIns.checkedInAt))
      .limit(1)
      .get();
    const mood = moodSchema.safeParse(row?.mood);
    return row && mood.success ? { ...row, mood: mood.data } : null;
  },
});
