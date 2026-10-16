import type { AdhanAlarm } from "@/shared/lib/android-alerts";

import type { ReminderRequest } from "./notification-request";

/**
 * Splits the Reminders by who delivers them: the Android adhan service plays
 * the full-adhan At-Time Alerts as alarms, expo-notifications delivers the
 * rest. `serviceAvailable` is false on iOS and when the build has no module,
 * and then everything stays a notification.
 */
export const routeReminders = (
  requests: readonly ReminderRequest[],
  serviceAvailable: boolean
): { notifications: ReminderRequest[]; adhanAlarms: AdhanAlarm[] } => {
  const notifications: ReminderRequest[] = [];
  const adhanAlarms: AdhanAlarm[] = [];
  for (const request of requests) {
    if (serviceAvailable && request.adhanService) {
      adhanAlarms.push({
        id: request.id,
        fireAt: request.fireAt,
        title: request.title,
        body: request.body,
        file: request.adhanService.file,
        stopLabel: request.adhanService.stopLabel,
        channelName: request.adhanService.channelName,
      });
    } else {
      notifications.push(request);
    }
  }
  return { notifications, adhanAlarms };
};
