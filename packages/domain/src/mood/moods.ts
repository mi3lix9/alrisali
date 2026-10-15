import { z } from "zod";

/** The moods a Believer can record in a Mood Check-in. */
export const MOODS = ["happy", "calm", "sad", "stressed", "angry"] as const;

export type Mood = (typeof MOODS)[number];

export const moodSchema = z.enum(MOODS);
