import { habitReminderSource, planReminders } from "@alrisali/domain/reminders";
import type { ReminderSettings } from "@alrisali/domain/reminders";
import type {
  CalculationMethod,
  HabitReminderPlan,
  HijriCalendar,
  Location,
  MessageStyle,
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

import { useReminderSettings } from "../data/reminder-settings";
import { toReminderRequest } from "../utils/notification-request";
import { syncReminders } from "../utils/scheduler";
import { useNotificationAccess } from "./use-notification-permission";

/**
 * Plans from now, on the device's current time zone (it changes when the
 * Believer travels), and brings the scheduled Reminders in line.
 */
/** The Believer settings the Reminders depend on. */
interface PlanningSettings {
  location: Location | null;
  calculationMethod: CalculationMethod;
  imsakMinutes: number;
  messageStyle: MessageStyle;
}

const planAndSync = async (
  believer: PlanningSettings,
  settings: ReminderSettings,
  habits: readonly HabitReminderPlan[],
  t: TFunction<"reminders">,
  hijri: HijriCalendar
): Promise<void> => {
  const { location, calculationMethod, imsakMinutes, messageStyle } = believer;
  const timeZone = getCalendars()[0]?.timeZone ?? Temporal.Now.timeZoneId();
  const reminders = planReminders({
    now: Temporal.Now.zonedDateTimeISO(timeZone),
    prayerTimes: location
      ? {
          coordinates: {
            latitude: location.latitude,
            longitude: location.longitude,
          },
          calculationMethod,
          imsakMinutes,
        }
      : null,
    settings,
    messageStyle,
    sources: [habitReminderSource(habits, messageStyle)],
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
 * `habits` is undefined while they load, so their Reminders are not cancelled
 * meanwhile.
 */
export const useReminderScheduler = (
  habits: readonly HabitReminderPlan[] | undefined
): void => {
  const { t } = useTranslation("reminders");
  const { data: believer } = useBelieverSettings();
  const { data: settings } = useReminderSettings();
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
    if (!believer || !settings || !habits || granted === undefined) {
      return;
    }
    void planAndSync(believer, settings, habits, t, hijri);
    const subscription = AppState.addEventListener("change", (state) => {
      if (state === "active") {
        void planAndSync(believer, settings, habits, t, hijri);
      }
    });
    return () => subscription.remove();
  }, [believer, settings, habits, t, granted, hijri]);
};
