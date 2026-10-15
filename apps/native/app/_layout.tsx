import "@/global.css";
import { Stack } from "expo-router";
import { useTranslation } from "react-i18next";

import { HabitReminderPlans } from "@/features/habits";
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

const Layout = () => (
  <AppProviders>
    <HabitReminderPlans>
      {(habits) => <ReminderScheduler habits={habits} />}
    </HabitReminderPlans>
    <RootStack />
  </AppProviders>
);

export default withMonitoring(Layout);
