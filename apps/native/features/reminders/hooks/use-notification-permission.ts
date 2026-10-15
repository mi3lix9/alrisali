import { useQuery } from "@tanstack/react-query";
import {
  getExactAlarmPermissionsAsync,
  getPermissionsAsync,
  requestExactAlarmPermissionsAsync,
  requestPermissionsAsync,
} from "expo-notifications";
import { useEffect } from "react";
import { AppState, Linking } from "react-native";

export interface NotificationAccess {
  /** Notifications may be shown. */
  granted: boolean;
  /** The app may still show the system prompt. */
  canAsk: boolean;
  /** Android: alarms fire on time (always true elsewhere). */
  exactAlarms: boolean;
}

const ACCESS_QUERY_KEY = ["reminders", "notification-access"];

const readAccess = async (): Promise<NotificationAccess> => {
  const [notifications, exact] = await Promise.all([
    getPermissionsAsync(),
    getExactAlarmPermissionsAsync(),
  ]);
  return {
    granted: notifications.granted,
    canAsk: notifications.canAskAgain,
    exactAlarms: exact.granted,
  };
};

const allowNotifications = async (canAsk: boolean): Promise<void> => {
  await (canAsk ? requestPermissionsAsync() : Linking.openSettings());
};

/**
 * Whether Reminders can arrive, read again whenever the app returns from the
 * device's settings, with the actions that fix it.
 */
export const useNotificationAccess = () => {
  const { data: access, refetch } = useQuery({
    queryKey: ACCESS_QUERY_KEY,
    queryFn: readAccess,
  });

  useEffect(() => {
    const subscription = AppState.addEventListener("change", (state) => {
      if (state === "active") {
        void refetch();
      }
    });
    return () => subscription.remove();
  }, [refetch]);

  return {
    access,
    /** Reads the access again (after another feature asked for it). */
    refresh: refetch,
    allow: async () => {
      await allowNotifications(access?.canAsk ?? false);
      await refetch();
    },
    allowExactAlarms: async () => {
      await requestExactAlarmPermissionsAsync();
      await refetch();
    },
  };
};
