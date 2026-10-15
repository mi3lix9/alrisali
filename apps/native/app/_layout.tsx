import "@/shared/lib/polyfills";
import "@/global.css";
import { Stack } from "expo-router";
import { useTranslation } from "react-i18next";

import { UsageAnalytics } from "@/features/analytics";
import { PushDeviceRegistration } from "@/features/announcements";
import { HabitReminderPlans } from "@/features/habits";
import { KhushuSheet } from "@/features/khushu";
import { useOnboarded } from "@/features/onboarding";
import { ReminderScheduler } from "@/features/reminders";
import { AppProviders } from "@/shared/lib/app-providers";
import { applyOtaUpdate } from "@/shared/lib/hot-updater";
import { initMonitoring, withMonitoring } from "@/shared/lib/monitoring";

initMonitoring();
// Runs in the background; failures are reported to Sentry.
void applyOtaUpdate();

export const unstable_settings = {
  initialRouteName: "(tabs)",
};

const RootStack = () => {
  const { t } = useTranslation();
  const onboarded = useOnboarded();

  // Until the first run is over, onboarding is the only screen.
  return (
    <Stack>
      <Stack.Protected guard={onboarded}>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen
          name="settings"
          options={{ headerShown: false, presentation: "modal" }}
        />
        <Stack.Screen
          name="account"
          options={{ title: t("account"), presentation: "modal" }}
        />
        <Stack.Screen name="calendar" />
        <Stack.Screen name="qibla" />
        <Stack.Screen name="quran" />
        <Stack.Screen name="debug-sentry" />
      </Stack.Protected>
      <Stack.Protected guard={!onboarded}>
        <Stack.Screen name="onboarding" options={{ headerShown: false }} />
      </Stack.Protected>
    </Stack>
  );
};

// The Khushu sheet is mounted once, above every tab, because a Salah can be
// ticked from Home or the Prayer tab.
const Layout = () => (
  <AppProviders>
    <HabitReminderPlans>
      {(habits) => <ReminderScheduler habits={habits} />}
    </HabitReminderPlans>
    <UsageAnalytics />
    <PushDeviceRegistration />
    <RootStack />
    <KhushuSheet />
  </AppProviders>
);

export default withMonitoring(Layout);
