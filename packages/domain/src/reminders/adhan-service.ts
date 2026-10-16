import { z } from "zod";

/**
 * The Android stream the full adhan plays on: the alarm stream (its own
 * volume, sounds even when the ringer is silent) or the media stream (the
 * volume of music and recitation).
 */
export const ADHAN_STREAMS = ["alarm", "media"] as const;

export type AdhanStream = (typeof ADHAN_STREAMS)[number];

export const adhanStreamSchema = z.enum(ADHAN_STREAMS);

/** How the Android adhan service plays; kept on the device. */
export const adhanServiceSettingsSchema = z.object({
  stream: adhanStreamSchema,
  /** Plays the adhan while Do Not Disturb is on. */
  playDuringDnd: z.boolean(),
  /** Opens the adhan screen over the lock screen when it starts. */
  fullScreen: z.boolean(),
});

export type AdhanServiceSettings = z.infer<typeof adhanServiceSettingsSchema>;

export const DEFAULT_ADHAN_SERVICE_SETTINGS: AdhanServiceSettings = {
  stream: "alarm",
  playDuringDnd: false,
  fullScreen: false,
};

/**
 * What the adhan service does when an At-Time Alert fires: nothing but the
 * notification (Do Not Disturb is on and the Believer did not allow the
 * adhan through it), or the stream to play on. Allowed through Do Not
 * Disturb, it plays on the alarm stream, the only one Android lets through.
 * The Android service (`adhan/AdhanPlayback.kt`) makes the same decision.
 */
export const adhanPlayback = (
  settings: AdhanServiceSettings,
  doNotDisturbOn: boolean
): AdhanStream | "skip" => {
  if (!doNotDisturbOn) {
    return settings.stream;
  }
  return settings.playDuringDnd ? "alarm" : "skip";
};
