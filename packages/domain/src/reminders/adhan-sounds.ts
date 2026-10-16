import { z } from "zod";

import { MAX_TAKBIR_SECONDS } from "../shared";
import { adhanSoundIdSchema } from "./settings";
import type { ReminderAlert } from "./settings";

/** One audio file of an adhan: the full adhan or its short takbir cut. */
export const adhanRecordingSchema = z.object({
  /** The file's name, as the device plays it (notification sounds by name). */
  file: z.string().min(1),
  seconds: z.number().positive(),
  bytes: z.number().int().positive(),
});

export type AdhanRecording = z.infer<typeof adhanRecordingSchema>;

/**
 * One entry of the adhan catalogue: a voice, with its full adhan and the
 * short takbir cut of the same voice.
 */
export const adhanSoundSchema = z.object({
  id: adhanSoundIdSchema,
  name: z.object({ ar: z.string().min(1), en: z.string().min(1) }),
  full: adhanRecordingSchema,
  takbir: adhanRecordingSchema.extend({
    seconds: z.number().positive().max(MAX_TAKBIR_SECONDS),
  }),
  /** Who recorded it and under what licence, as the Admin entered it. */
  credit: z.string(),
});

export type AdhanSound = z.infer<typeof adhanSoundSchema>;

/** The catalogue sound with this id, if it is installed. */
export const findAdhanSound = (
  installed: readonly AdhanSound[],
  id: string
): AdhanSound | undefined => installed.find((sound) => sound.id === id);

/**
 * Whether the full adhan can be chosen: only once a recording is on the
 * device, so it never depends on the network at the Prayer Time.
 */
export const isFullAdhanAvailable = (
  installed: readonly AdhanSound[]
): boolean => installed.length > 0;

/**
 * What one At-Time Alert sounds like on the device, from the installed
 * catalogue. `notification` is the notification's own sound (null: the
 * system's); `full` is the full adhan, played when the Believer opens the
 * notification (iOS) or as the alert itself (Android).
 */
export interface AtTimeSound {
  notification: AdhanRecording | null;
  full: AdhanRecording | null;
}

const SYSTEM_SOUND: AtTimeSound = { notification: null, full: null };

/**
 * The sound of an At-Time Alert: the chosen voice's takbir cut, and for the
 * full adhan its full recording too. A sound not installed (or the system
 * sound) falls back to the system's notification sound.
 */
export const atTimeSound = (
  alert: ReminderAlert,
  installed: readonly AdhanSound[]
): AtTimeSound => {
  if (alert.kind !== "takbir" && alert.kind !== "adhan") {
    return SYSTEM_SOUND;
  }
  const sound = findAdhanSound(installed, alert.adhanSound);
  if (!sound) {
    return SYSTEM_SOUND;
  }
  return {
    notification: sound.takbir,
    full: alert.kind === "adhan" ? sound.full : null,
  };
};
