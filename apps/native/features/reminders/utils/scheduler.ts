import { diffSchedule, isStaleAlert } from "@alrisali/domain/reminders";
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
import { Temporal } from "temporal-polyfill";

import { REMINDER_CHANNELS } from "./notification-request";
import type { ReminderRequest } from "./notification-request";

/** Marks the notifications the scheduler owns, with their fingerprint. */
export interface ReminderData {
  reminder: true;
  fingerprint: string;
  /** When it was due, in epoch milliseconds. */
  fireAt: number;
  /** The full adhan to play when it is opened (iOS), if any. */
  adhanOnOpen: string | null;
}

/** A notification's data, when it is one of the scheduler's. */
export const readReminderData = (data: unknown): ReminderData | null => {
  if (
    typeof data !== "object" ||
    data === null ||
    !("reminder" in data) ||
    data.reminder !== true ||
    !("fingerprint" in data) ||
    typeof data.fingerprint !== "string"
  ) {
    return null;
  }
  return {
    reminder: true,
    fingerprint: data.fingerprint,
    // Scheduled by an older app: no due time or adhan was kept.
    fireAt:
      "fireAt" in data && typeof data.fireAt === "number" ? data.fireAt : 0,
    adhanOnOpen:
      "adhanOnOpen" in data && typeof data.adhanOnOpen === "string"
        ? data.adhanOnOpen
        : null,
  };
};

/** Whether a Reminder is being delivered more than 30 minutes late. */
export const isStaleReminder = (data: ReminderData | null): boolean =>
  data !== null &&
  data.fireAt > 0 &&
  isStaleAlert(
    Temporal.Instant.fromEpochMilliseconds(data.fireAt),
    Temporal.Now.instant()
  );

// A Reminder arriving while the app is open still shows and sounds, unless
// it arrives over 30 minutes late (the device was off): then it is dropped.
setNotificationHandler({
  handleNotification: (notification) => {
    const show = !isStaleReminder(
      readReminderData(notification.request.content.data)
    );
    return Promise.resolve({
      shouldShowBanner: show,
      shouldShowList: show,
      shouldPlaySound: show,
      shouldSetBadge: false,
    });
  },
});

let channelsReady: Promise<void> | null = null;

/** Creates the Android channels the Reminders and At-Time Alerts play on. */
export const ensureChannels = (): Promise<void> => {
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
    const data = readReminderData(content.data);
    return data === null
      ? []
      : [{ id: identifier, fingerprint: data.fingerprint }];
  });
  const { cancel, schedule } = diffSchedule(scheduled, requests);
  await Promise.all(cancel.map((id) => cancelScheduledNotificationAsync(id)));
  await Promise.all(
    schedule.map(
      ({
        id,
        fingerprint,
        fireAt,
        title,
        body,
        channelId,
        sound,
        adhanOnOpen,
      }) =>
        scheduleNotificationAsync({
          identifier: id,
          content: {
            title,
            body,
            sound: sound ?? false,
            data: {
              reminder: true,
              fingerprint,
              fireAt,
              adhanOnOpen,
            } satisfies ReminderData,
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
