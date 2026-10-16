import { TEST_ALERT_DELAY_SECONDS } from "@alrisali/domain/reminders";
import {
  scheduleNotificationAsync,
  SchedulableTriggerInputTypes,
} from "expo-notifications";

import { askNotificationsInContext } from "./ask-notifications";
import { AT_TIME_SYSTEM_CHANNEL } from "./notification-request";
import { ensureChannels } from "./scheduler";

/**
 * Sends a notification a few seconds from now on the At-Time channel (the
 * system sound), so the Believer can confirm a fix worked. Returns false when
 * notifications are not allowed.
 */
export const sendTestAlert = async (
  title: string,
  body: string
): Promise<boolean> => {
  if (!(await askNotificationsInContext())) {
    return false;
  }
  await ensureChannels();
  await scheduleNotificationAsync({
    content: { title, body, sound: "default" },
    trigger: {
      type: SchedulableTriggerInputTypes.TIME_INTERVAL,
      seconds: TEST_ALERT_DELAY_SECONDS,
      channelId: AT_TIME_SYSTEM_CHANNEL,
    },
  });
  return true;
};
