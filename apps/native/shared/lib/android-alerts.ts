import { requireOptionalNativeModule } from "expo";
import { Platform } from "react-native";

/** A full-adhan alarm for the Android adhan service. */
export interface AdhanAlarm {
  /** The planner's alert id (date, Prayer Time, kind). */
  id: string;
  /** When it is due, in epoch milliseconds. */
  fireAt: number;
  title: string;
  body: string;
  /** The installed recording's file name (a raw resource) or an absolute path. */
  file: string;
  /** The Stop action's label, in the app's language. */
  stopLabel: string;
  /** The notification channel's name, in the app's language. */
  channelName: string;
}

/** How the adhan service plays (`adhanServiceSettingsSchema` in the domain). */
export interface AdhanServiceSettings {
  stream: "alarm" | "media";
  playDuringDnd: boolean;
  fullScreen: boolean;
}

/**
 * What the Android-only native module (`modules/android-alerts`) offers: the
 * adhan service today, and the Alert Health checks as they are added.
 */
interface AndroidAlertsModule {
  /** Replaces every armed full-adhan alarm with these; empty cancels all. */
  scheduleAdhanAlarms: (alarms: readonly AdhanAlarm[]) => void;
  cancelAdhanAlarms: () => void;
  /** Stops the adhan now if it is playing. */
  stopAdhan: () => void;
  getAdhanSettings: () => AdhanServiceSettings;
  setAdhanSettings: (settings: AdhanServiceSettings) => void;
  /** Whether the full-screen adhan may open over the lock screen. */
  canUseFullScreenIntent: () => boolean;
  openFullScreenIntentSettings: () => void;
  /** Alert Health: exact alarms (always true before Android 12). */
  canScheduleExactAlarms: () => boolean;
  openExactAlarmSettings: () => void;
  /** Alert Health: whether battery optimisation is off for the app (good). */
  isIgnoringBatteryOptimizations: () => boolean;
  openBatteryOptimizationSettings: () => void;
  /**
   * Alert Health: the phone maker (lower case) and whether we know its
   * autostart screen. Android cannot report if autostart is on.
   */
  getAutostartInfo: () => { manufacturer: string; hasScreen: boolean };
  /** Opens the maker's autostart screen, else the app's details. */
  openAutostartSettings: () => void;
}

/**
 * The Android alerts module, or null on iOS and in a build made without it
 * (so the app degrades to notification sounds, like the speech probe).
 */
export const androidAlerts: AndroidAlertsModule | null =
  Platform.OS === "android"
    ? requireOptionalNativeModule<AndroidAlertsModule>("AndroidAlerts")
    : null;
