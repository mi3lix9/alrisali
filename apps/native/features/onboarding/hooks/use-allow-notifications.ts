import { useMutation } from "@tanstack/react-query";
import {
  getPermissionsAsync,
  requestPermissionsAsync,
} from "expo-notifications";

export type NotificationsOutcome = "allowed" | "declined";

/**
 * Shows the system prompt for notifications, the only place the app asks
 * unprompted by a fix: Reminders arrive only once it is allowed. Already
 * decided? It reports the decision without asking again.
 */
export const useAllowNotifications = () =>
  useMutation({
    mutationFn: async (): Promise<NotificationsOutcome> => {
      const current = await getPermissionsAsync();
      if (current.granted) {
        return "allowed";
      }
      if (!current.canAskAgain) {
        return "declined";
      }
      const asked = await requestPermissionsAsync();
      return asked.granted ? "allowed" : "declined";
    },
  });
