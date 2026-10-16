import {
  alertChecks,
  alertProblems,
  sendsNotifications,
} from "@alrisali/domain/reminders";
import type {
  AlertCheck,
  AlertHealthReadings,
} from "@alrisali/domain/reminders";
import { useCallback, useEffect, useState } from "react";
import { AppState, Linking, Platform } from "react-native";

import { androidAlerts } from "@/shared/lib/android-alerts";

import { useReminderSettings } from "../data/reminder-settings";
import { useNotificationAccess } from "./use-notification-permission";

interface DeviceReadings {
  exactAlarms: boolean | null;
  batteryOptimised: boolean;
  maker: string;
  screenKnown: boolean;
  autostartConfirmed: boolean;
}

// What only the Android module can read; read again whenever it may have changed.
const readDevice = (): DeviceReadings => {
  const autostart = androidAlerts?.getAutostartInfo();
  return {
    exactAlarms: androidAlerts?.canScheduleExactAlarms() ?? null,
    batteryOptimised: androidAlerts
      ? !androidAlerts.isIgnoringBatteryOptimizations()
      : false,
    maker: autostart?.manufacturer ?? "",
    screenKnown: autostart?.hasScreen ?? false,
    autostartConfirmed: androidAlerts?.isAutostartConfirmed() ?? false,
  };
};

/**
 * The Alert Health checks, read from the device (again on every return from
 * its settings), the problems Settings' dot and Home's banner report, and the
 * fix for each check. `readings` is null until the first read.
 */
export const useAlertHealth = () => {
  const { access, allow, allowExactAlarms, refresh } = useNotificationAccess();
  const { data: settings } = useReminderSettings();
  const [device, setDevice] = useState(readDevice);

  useEffect(() => {
    const subscription = AppState.addEventListener("change", (state) => {
      if (state === "active") {
        setDevice(readDevice());
      }
    });
    return () => subscription.remove();
  }, []);

  const readings: AlertHealthReadings | null =
    access && settings
      ? {
          platform: Platform.OS === "ios" ? "ios" : "android",
          alertsInUse: sendsNotifications(settings),
          notifications: access.granted,
          sound: access.sound,
          exactAlarms: device.exactAlarms ?? access.exactAlarms,
          batteryOptimised: device.batteryOptimised,
          autostart: {
            screenKnown: device.screenKnown,
            confirmed: device.autostartConfirmed,
          },
        }
      : null;

  const confirmAutostart = useCallback((confirmed: boolean) => {
    androidAlerts?.setAutostartConfirmed(confirmed);
    setDevice(readDevice());
  }, []);

  const fixes = {
    notifications: () => allow(),
    sound: () => Linking.openSettings(),
    exactAlarms: async () => {
      if (androidAlerts) {
        androidAlerts.openExactAlarmSettings();
      } else {
        await allowExactAlarms();
      }
    },
    batteryOptimisation: () => androidAlerts?.openBatteryOptimizationSettings(),
    autostart: () => androidAlerts?.openAutostartSettings(),
  } as const;

  const checks: AlertCheck[] = readings ? alertChecks(readings) : [];
  return {
    readings,
    checks,
    /** The failing checks to report on Settings and Home (none until read). */
    problems: readings ? alertProblems(readings) : [],
    maker: device.maker,
    fixes,
    confirmAutostart,
    refresh: async () => {
      setDevice(readDevice());
      await refresh();
    },
  };
};
