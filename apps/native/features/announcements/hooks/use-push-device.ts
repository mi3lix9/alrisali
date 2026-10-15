import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  addNotificationReceivedListener,
  useLastNotificationResponse,
} from "expo-notifications";
import { router } from "expo-router";
import { useEffect } from "react";
import { useTranslation } from "react-i18next";
import { AppState, Platform } from "react-native";

import { events } from "@/shared/lib/events";
import { client, orpc } from "@/shared/lib/orpc";
import { usePreferences } from "@/shared/lib/preferences";

import { useAnnouncementsPreference } from "../data/announcements-preference";
import { readPushToken } from "../utils/push-token";

const PUSH_TOKEN_QUERY_KEY = ["announcements", "push-token"];

/**
 * This device's Expo push token; null until notifications are allowed (see
 * `readPushToken`). Read again on every foreground.
 */
export const usePushToken = () => {
  const { t } = useTranslation("announcements");
  return useQuery({
    queryKey: PUSH_TOKEN_QUERY_KEY,
    queryFn: () => readPushToken(t("channel")),
  });
};

const announcementIdOf = (data: unknown): string | null =>
  typeof data === "object" &&
  data !== null &&
  "announcementId" in data &&
  typeof data.announcementId === "string"
    ? data.announcementId
    : null;

/**
 * Keeps the server's record of this device current: its push token, the
 * language Announcements arrive in, whether they are on, and the Believer
 * signed in on it. Checks in on launch, on every foreground, on sign-in and
 * sign-out, and whenever one of those changes. Opens the inbox when the
 * Believer taps an Announcement.
 */
export const usePushDevice = () => {
  const queryClient = useQueryClient();
  const { data: pushToken } = usePushToken();
  const language = usePreferences((state) => state.language);
  const enabled = useAnnouncementsPreference((state) => state.enabled);

  useEffect(() => {
    if (!pushToken || (Platform.OS !== "ios" && Platform.OS !== "android")) {
      return;
    }
    const platform = Platform.OS;
    const checkIn = async () => {
      try {
        await client.announcements.registerDevice({
          pushToken,
          platform,
          language,
          enabled,
        });
      } catch {
        // Offline: the next foreground checks in again.
      }
    };
    void checkIn();
    const subscription = AppState.addEventListener("change", (state) => {
      if (state === "active") {
        void queryClient.invalidateQueries({ queryKey: PUSH_TOKEN_QUERY_KEY });
        void checkIn();
      }
    });
    const signedIn = events.on("SignedIn", checkIn);
    const signedOut = events.on("SignedOut", checkIn);
    return () => {
      subscription.remove();
      signedIn();
      signedOut();
    };
  }, [pushToken, language, enabled, queryClient]);

  // An Announcement arriving while the app is open joins the inbox.
  useEffect(() => {
    const subscription = addNotificationReceivedListener((notification) => {
      if (announcementIdOf(notification.request.content.data)) {
        void queryClient.invalidateQueries({
          queryKey: orpc.announcements.inbox.key(),
        });
      }
    });
    return () => subscription.remove();
  }, [queryClient]);

  // Tapping one, even from a closed app, opens the inbox.
  const response = useLastNotificationResponse();
  useEffect(() => {
    if (
      response &&
      announcementIdOf(response.notification.request.content.data)
    ) {
      router.push("/settings/announcements");
    }
  }, [response]);
};
