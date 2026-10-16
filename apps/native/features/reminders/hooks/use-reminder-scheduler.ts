import {
  habitReminderSource,
  khatmahReminderSource,
  nightDuaReminderSource,
  planReminders,
  qadaReminderSource,
} from "@alrisali/domain/reminders";
import type {
  HabitReminderMessage,
  KhatmahReminderMessage,
  NightDuaPlan,
  NightDuaReminderMessage,
  QadaReminderMessage,
  ReminderSettings,
} from "@alrisali/domain/reminders";
import type {
  CalculationMethod,
  CustomAngles,
  HabitReminderPlan,
  HijriCalendar,
  KhatmahReminderPlan,
  Location,
  MessageStyle,
  QadaReminderPlan,
} from "@alrisali/domain/shared";
import { captureException } from "@sentry/react-native";
import { getCalendars } from "expo-localization";
import type { TFunction } from "i18next";
import { useEffect } from "react";
import { useTranslation } from "react-i18next";
import { AppState } from "react-native";
import { Temporal } from "temporal-polyfill";

import { useBelieverSettings } from "@/shared/lib/believer-settings";
import { events } from "@/shared/lib/events";
import { useHijriCalendar } from "@/shared/lib/hijri-calendar";
import { launchLanguage } from "@/shared/lib/preferences";

import { useNightDuaAlerts } from "../data/night-dua-alerts";
import { useReminderSettings } from "../data/reminder-settings";
import { toReminderRequest } from "../utils/notification-request";
import { syncReminders } from "../utils/scheduler";
import { useNotificationAccess } from "./use-notification-permission";

/** Stable while the worship mapping has not loaded. */
const NO_WORSHIP: NightDuaPlan["worship"] = [];

/** The Believer settings the Reminders depend on. */
interface PlanningSettings {
  location: Location | null;
  calculationMethod: CalculationMethod;
  customAngles: CustomAngles;
  imsakMinutes: number;
  messageStyle: MessageStyle;
}

/**
 * Plans from now and brings the scheduled Reminders in line. The window and
 * Habit Reminders follow the device's current time zone (it changes when the
 * Believer travels); Prayer Time Reminders follow the location's own.
 */
const planAndSync = async (
  believer: PlanningSettings,
  settings: ReminderSettings,
  habits: readonly HabitReminderPlan[],
  qada: QadaReminderPlan | null,
  khatmah: KhatmahReminderPlan | null,
  t: TFunction<"reminders">,
  hijri: HijriCalendar,
  nightDuas: Pick<NightDuaPlan, "alerts" | "worship">
): Promise<void> => {
  const {
    location,
    calculationMethod,
    customAngles,
    imsakMinutes,
    messageStyle,
  } = believer;
  const prayerTimes = location
    ? {
        coordinates: {
          latitude: location.latitude,
          longitude: location.longitude,
        },
        calculationMethod,
        imsakMinutes,
        customAngles,
      }
    : null;
  const timeZone = getCalendars()[0]?.timeZone ?? Temporal.Now.timeZoneId();
  const reminders = planReminders<
    | HabitReminderMessage
    | QadaReminderMessage
    | KhatmahReminderMessage
    | NightDuaReminderMessage
  >({
    now: Temporal.Now.zonedDateTimeISO(timeZone),
    prayerTimes,
    settings,
    messageStyle,
    sources: [
      habitReminderSource(habits, messageStyle),
      qadaReminderSource(qada),
      khatmahReminderSource(khatmah),
      nightDuaReminderSource({
        ...nightDuas,
        prayerTimes,
        hijri,
      }),
    ],
    hijri,
  });
  try {
    await syncReminders(
      reminders.map((reminder) =>
        toReminderRequest(reminder, t, launchLanguage)
      )
    );
  } catch (error) {
    // Tried again on the next foreground or settings change.
    captureException(error);
  }
};

/**
 * Keeps the rolling window of Reminders scheduled: on launch, whenever the
 * app returns to the foreground (topping it up and following a new time
 * zone), as soon as any setting or Habit it depends on changes, and when
 * notifications are allowed (in onboarding or on the Reminders screen).
 * `habits`, `qada` and `khatmah` are undefined while they load, so their Reminders are
 * not cancelled meanwhile.
 */
export const useReminderScheduler = (
  habits: readonly HabitReminderPlan[] | undefined,
  qada: QadaReminderPlan | null | undefined,
  khatmah: KhatmahReminderPlan | null | undefined,
  worship: NightDuaPlan["worship"] | undefined
): void => {
  const { t } = useTranslation("reminders");
  const { data: believer } = useBelieverSettings();
  const { data: settings } = useReminderSettings();
  const { data: nightAlerts } = useNightDuaAlerts();
  // Imsak's At-Time Alert follows Ramadan by the Believer's Hijri calendar.
  const hijri = useHijriCalendar();
  const { access, refresh } = useNotificationAccess();
  const granted = access?.granted;

  // Onboarding asks for notifications: read the answer when it finishes.
  useEffect(
    () =>
      events.on("OnboardingCompleted", () => {
        void refresh();
      }),
    [refresh]
  );

  useEffect(() => {
    if (
      !believer ||
      !settings ||
      !habits ||
      qada === undefined ||
      khatmah === undefined ||
      granted === undefined ||
      nightAlerts === undefined ||
      // The ziyarah comes from the worship mapping.
      (nightAlerts.ziyarah && worship === undefined)
    ) {
      return;
    }
    const nightDuas = { alerts: nightAlerts, worship: worship ?? NO_WORSHIP };
    void planAndSync(
      believer,
      settings,
      habits,
      qada,
      khatmah,
      t,
      hijri,
      nightDuas
    );
    const subscription = AppState.addEventListener("change", (state) => {
      if (state === "active") {
        void planAndSync(
          believer,
          settings,
          habits,
          qada,
          khatmah,
          t,
          hijri,
          nightDuas
        );
      }
    });
    return () => subscription.remove();
  }, [
    believer,
    settings,
    habits,
    qada,
    khatmah,
    t,
    granted,
    hijri,
    nightAlerts,
    worship,
  ]);
};
