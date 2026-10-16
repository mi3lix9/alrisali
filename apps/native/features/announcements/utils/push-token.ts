import Constants from "expo-constants";
import {
  AndroidImportance,
  getExpoPushTokenAsync,
  getPermissionsAsync,
  setNotificationChannelAsync,
} from "expo-notifications";
import { Platform } from "react-native";

/** Announcements' Android channel; the server sends with this id. */
export const ANNOUNCEMENTS_CHANNEL = "announcements";

/** The EAS project push tokens belong to (app.config.ts `extra.eas`). */
const projectId = (): string | null => {
  const eas: unknown = Constants.expoConfig?.extra?.eas;
  const fromConfig =
    typeof eas === "object" &&
    eas !== null &&
    "projectId" in eas &&
    typeof eas.projectId === "string"
      ? eas.projectId
      : null;
  return fromConfig ?? Constants.easConfig?.projectId ?? null;
};

/**
 * This device's Expo push token, or null while notifications are not
 * allowed, outside an EAS build (no project id) or on a simulator. Never
 * asks for permission: the Announcements screen does, when the Believer
 * chooses to. `channelName` names the Android channel in Settings.
 */
export const readPushToken = async (
  channelName: string
): Promise<string | null> => {
  const id = projectId();
  if (!id || (Platform.OS !== "ios" && Platform.OS !== "android")) {
    return null;
  }
  const { granted } = await getPermissionsAsync();
  if (!granted) {
    return null;
  }
  if (Platform.OS === "android") {
    await setNotificationChannelAsync(ANNOUNCEMENTS_CHANNEL, {
      name: channelName,
      importance: AndroidImportance.DEFAULT,
    });
  }
  try {
    const { data } = await getExpoPushTokenAsync({ projectId: id });
    return data;
  } catch {
    // Simulators and devices without Google Play services have no token.
    return null;
  }
};
