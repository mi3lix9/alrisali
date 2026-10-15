import "@/shared/lib/polyfills";
import "@/global.css";
import { Stack } from "expo-router";
import { useTranslation } from "react-i18next";

import { UsageAnalytics } from "@/features/analytics";
import { PushDeviceRegistration } from "@/features/announcements";
import { CompanionAwards } from "@/features/companion";
import { HabitReminderPlans } from "@/features/habits";
import { KhushuSheet } from "@/features/khushu";
import { useOnboarded } from "@/features/onboarding";
import { CompletedSalahLogger } from "@/features/prayer-log";
import { ReminderScheduler } from "@/features/reminders";
import { AppProviders } from "@/shared/lib/app-providers";
import { applyOtaUpdate } from "@/shared/lib/hot-updater";
import { initMonitoring, withMonitoring } from "@/shared/lib/monitoring";

initMonitoring();
// Runs in the background; failures are reported to Sentry.
void applyOtaUpdate();

export const unstable_settings = {
  anchor: "(tabs)",
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
        <Stack.Screen name="insights" />
        <Stack.Screen name="qibla" />
        <Stack.Screen name="prayer-assistant" />
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
// ticked from Home or the Prayer tab, or logged when the Prayer Assistant
// finishes one (which the Prayer Log hears at the root).
const Layout = () => (
  <AppProviders>
    <HabitReminderPlans>
      {(habits) => <ReminderScheduler habits={habits} />}
    </HabitReminderPlans>
    <UsageAnalytics />
    <CompanionAwards />
    <PushDeviceRegistration />
    <CompletedSalahLogger />
    <RootStack />
    <KhushuSheet />
  </AppProviders>
);

export default withMonitoring(Layout);
