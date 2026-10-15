import { diffSchedule } from "@alrisali/domain/reminders";
import {
  AndroidImportance,
  cancelScheduledNotificationAsync,
  getAllScheduledNotificationsAsync,
  getPermissionsAsync,
  scheduleNotificationAsync,
  SchedulableTriggerInputTypes,
  setNotificationChannelAsync,
  setNotificationHandler,
} from "expo-notifications";
import { Platform } from "react-native";

import { REMINDER_CHANNELS } from "./notification-request";
import type { ReminderRequest } from "./notification-request";

// A Reminder arriving while the app is open still shows and sounds.
setNotificationHandler({
  handleNotification: () =>
    Promise.resolve({
      shouldShowBanner: true,
      shouldShowList: true,
      shouldPlaySound: true,
      shouldSetBadge: false,
    }),
});

/** Marks the notifications the scheduler owns, with their fingerprint. */
interface ReminderData {
  reminder: true;
  fingerprint: string;
}

const readFingerprint = (data: unknown): string | null =>
  typeof data === "object" &&
  data !== null &&
  "reminder" in data &&
  data.reminder === true &&
  "fingerprint" in data &&
  typeof data.fingerprint === "string"
    ? data.fingerprint
    : null;

let channelsReady: Promise<void> | null = null;

const ensureChannels = (): Promise<void> => {
  channelsReady ??= (async () => {
    if (Platform.OS !== "android") {
      return;
    }
    await Promise.all(
      REMINDER_CHANNELS.map(({ id, sound }) =>
        setNotificationChannelAsync(id, {
          name: id,
          importance: AndroidImportance.HIGH,
          sound,
          enableVibrate: sound !== null,
        })
      )
    );
  })();
  return channelsReady;
};

const applyReminders = async (
  requests: readonly ReminderRequest[]
): Promise<void> => {
  // Never prompts: onboarding offers notifications, and the Reminders screen
  // fixes them when they are off.
  const { granted } = await getPermissionsAsync();
  if (requests.length > 0 && !granted) {
    return;
  }
  await ensureChannels();
  const pending = await getAllScheduledNotificationsAsync();
  const scheduled = pending.flatMap(({ identifier, content }) => {
    const fingerprint = readFingerprint(content.data);
    return fingerprint === null ? [] : [{ id: identifier, fingerprint }];
  });
  const { cancel, schedule } = diffSchedule(scheduled, requests);
  await Promise.all(cancel.map((id) => cancelScheduledNotificationAsync(id)));
  await Promise.all(
    schedule.map(({ id, fingerprint, fireAt, title, body, channelId, sound }) =>
      scheduleNotificationAsync({
        identifier: id,
        content: {
          title,
          body,
          sound: sound ?? false,
          data: { reminder: true, fingerprint } satisfies ReminderData,
        },
        trigger: {
          type: SchedulableTriggerInputTypes.DATE,
          date: fireAt,
          channelId,
        },
      })
    )
  );
};

/** Settles when the last sync has finished, whether or not it succeeded. */
let previousSync: Promise<void> = Promise.resolve();

const applyAfter = async (
  previous: Promise<void>,
  requests: readonly ReminderRequest[]
): Promise<void> => {
  await previous;
  await applyReminders(requests);
};

const settled = async (sync: Promise<void>): Promise<void> => {
  try {
    await sync;
  } catch {
    // The caller of that sync reports its failure; the next one still runs.
  }
};

/**
 * Makes the device's scheduled Reminders match `requests`, leaving those
 * already right. Runs one at a time, so a launch, a resume and a settings
 * change in quick succession never interleave.
 */
export const syncReminders = async (
  requests: readonly ReminderRequest[]
): Promise<void> => {
  if (Platform.OS === "web") {
    return;
  }
  const sync = applyAfter(previousSync, requests);
  previousSync = settled(sync);
  await sync;
};
