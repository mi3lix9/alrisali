import { diffSchedule, isStaleAlert } from "@alrisali/domain/reminders";
import {
  AndroidImportance,
  cancelScheduledNotificationAsync,
  dismissNotificationAsync,
  getAllScheduledNotificationsAsync,
  getPermissionsAsync,
  getPresentedNotificationsAsync,
  scheduleNotificationAsync,
  SchedulableTriggerInputTypes,
  setNotificationChannelAsync,
  setNotificationHandler,
} from "expo-notifications";
import { Platform } from "react-native";
import { Temporal } from "temporal-polyfill";

import { androidAlerts } from "@/shared/lib/android-alerts";

import { routeReminders } from "./adhan-routing";
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
//
// Where else a stale alert is stopped, and the platform limit:
// - Android notifications: expo-notifications drops a past-due date trigger
//   when it re-arms after a reboot ("will not trigger in the future,
//   removing", ExpoSchedulingDelegate.kt), so a phone that was off delivers
//   none late. The adhan service drops alarms past the stale window in
//   `AdhanScheduler.arm` and `AdhanAlarmReceiver`, on boot, time change and
//   app update.
// - Every launch and resume (`syncReminders`) cancels pending past-due
//   Reminders (they are no longer planned) and dismisses delivered ones that
//   are over 30 minutes late.
// - Limit: a local notification the system delivers late while the app is not
//   running (iOS after a restart; Android if the OS defers an alarm) cannot be
//   intercepted, as neither platform runs app code for local notifications
//   (iOS has no service extension for local ones). It shows, and is taken
//   down the next time the app opens.
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

/** The ids of delivered Reminders more than 30 minutes past due at `now`. */
export const staleDeliveredIds = (
  delivered: readonly { identifier: string; data: unknown }[],
  now: Temporal.Instant
): string[] =>
  delivered.flatMap(({ identifier, data }) => {
    const reminder = readReminderData(data);
    return reminder !== null &&
      reminder.fireAt > 0 &&
      isStaleAlert(Temporal.Instant.fromEpochMilliseconds(reminder.fireAt), now)
      ? [identifier]
      : [];
  });

/**
 * Takes down Reminders the system delivered more than 30 minutes late (the
 * phone was off or asleep), so the Believer is not called to a Salah that
 * has passed.
 */
const dismissStaleDelivered = async (): Promise<void> => {
  const presented = await getPresentedNotificationsAsync();
  const stale = staleDeliveredIds(
    presented.map(({ request }) => ({
      identifier: request.identifier,
      data: request.content.data,
    })),
    Temporal.Now.instant()
  );
  await Promise.all(stale.map((id) => dismissNotificationAsync(id)));
};

const applyReminders = async (
  allRequests: readonly ReminderRequest[]
): Promise<void> => {
  // Full-adhan alarms go to the Android adhan service; it replaces the set it
  // holds each time, so alarms no longer planned are cancelled with it.
  const { notifications: requests, adhanAlarms } = routeReminders(
    allRequests,
    androidAlerts !== null
  );
  // Never prompts: onboarding offers notifications, and the Reminders screen
  // fixes them when they are off.
  const { granted } = await getPermissionsAsync();
  if (allRequests.length > 0 && !granted) {
    // Without permission nothing may sound: the native adhan alarms armed
    // earlier (before permission was taken away) are disarmed too, since the
    // native receiver plays without asking.
    androidAlerts?.scheduleAdhanAlarms([]);
    return;
  }
  androidAlerts?.scheduleAdhanAlarms(adhanAlarms);
  await ensureChannels();
  await dismissStaleDelivered();
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
