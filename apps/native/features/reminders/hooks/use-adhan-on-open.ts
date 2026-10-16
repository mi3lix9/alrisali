import {
  DEFAULT_ACTION_IDENTIFIER,
  useLastNotificationResponse,
} from "expo-notifications";
import { useEffect, useRef } from "react";

import { playAdhan } from "../utils/adhan-player";
import { isStaleReminder, readReminderData } from "../utils/scheduler";

/**
 * iOS plays at most 30 seconds of a notification sound, so a full-adhan
 * At-Time Alert sounds the takbir; opening it plays the full adhan in the app.
 * An alert opened more than 30 minutes after its time plays nothing.
 */
export const useAdhanOnOpen = (): void => {
  const response = useLastNotificationResponse();
  const played = useRef<string | null>(null);

  useEffect(() => {
    if (!response || response.actionIdentifier !== DEFAULT_ACTION_IDENTIFIER) {
      return;
    }
    const { identifier, content } = response.notification.request;
    const data = readReminderData(content.data);
    // The last response stays the same across re-renders: play it once.
    if (!data?.adhanOnOpen || played.current === identifier) {
      return;
    }
    played.current = identifier;
    if (!isStaleReminder(data)) {
      playAdhan(data.adhanOnOpen);
    }
  }, [response]);
};
