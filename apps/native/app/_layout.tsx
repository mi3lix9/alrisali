import "@/global.css";
import { Stack } from "expo-router";
import { useTranslation } from "react-i18next";

import { KhushuSheet } from "@/features/khushu";
import { CompletedSalahLogger } from "@/features/prayer-log";
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

  return (
    <Stack>
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen
        name="settings"
        options={{ headerShown: false, presentation: "modal" }}
      />
      <Stack.Screen
        name="account"
        options={{ title: t("account"), presentation: "modal" }}
      />
    </Stack>
  );
};

// The Khushu sheet is mounted once, above every tab, because a Salah can be
// ticked from Home or the Prayer tab, or logged when the Prayer Assistant
// finishes one (which the Prayer Log hears at the root).
const Layout = () => (
  <AppProviders>
    <ReminderScheduler />
    <CompletedSalahLogger />
    <RootStack />
    <KhushuSheet />
  </AppProviders>
);

export default withMonitoring(Layout);
