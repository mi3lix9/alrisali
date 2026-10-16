import { atTimeAlert, atTimeSound } from "@alrisali/domain/reminders";
import type { AdhanSound, ReminderRule } from "@alrisali/domain/reminders";
import { scheduleNotificationAsync } from "expo-notifications";

import { playAdhan } from "./adhan-player";
import { askNotificationsInContext } from "./ask-notifications";
import { AT_TIME_SYSTEM_CHANNEL } from "./notification-request";
import { ensureChannels } from "./scheduler";

/**
 * How a Test went: a recording plays in the app, the system sound comes as a
 * notification now, or nothing can sound (no sound chosen, or notifications
 * are not allowed).
 */
export type TestOutcome = "playing" | "notified" | "no-sound" | "denied";

/**
 * Plays the unsaved At-Time Alert choice: the recording it would play (the
 * full adhan, or the takbir cut), else a notification now with the system's
 * sound, which is what the alert itself would sound like.
 */
export const testAtTimeAlert = async (
  rule: ReminderRule,
  installed: readonly AdhanSound[],
  title: string,
  onEnd: () => void
): Promise<TestOutcome> => {
  const alert = atTimeAlert(rule);
  if (!alert || alert.kind === "silent") {
    return "no-sound";
  }
  const { notification, full } = atTimeSound(alert, installed);
  const recording = full ?? notification;
  if (recording && playAdhan(recording.file, onEnd)) {
    return "playing";
  }
  // The first playback that needs a notification asks for them.
  if (!(await askNotificationsInContext())) {
    return "denied";
  }
  await ensureChannels();
  await scheduleNotificationAsync({
    content: { title, sound: "default" },
    trigger: { channelId: AT_TIME_SYSTEM_CHANNEL },
  });
  return "notified";
};
