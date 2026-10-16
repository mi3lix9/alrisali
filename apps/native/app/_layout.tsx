import "@/shared/lib/polyfills";
import "@/global.css";
import { Stack } from "expo-router";
import { useEffect } from "react";
import { useTranslation } from "react-i18next";

import { UsageAnalytics } from "@/features/analytics";
import { PushDeviceRegistration } from "@/features/announcements";
import { CompanionAwards } from "@/features/companion";
import { WorshipMappingPlans } from "@/features/daily-content";
import { HabitReminderPlans } from "@/features/habits";
import { KhatmahReminderPlans } from "@/features/khatmah";
import { KhushuSheet } from "@/features/khushu";
import { LinkShortcuts } from "@/features/links";
import { useOnboarded } from "@/features/onboarding";
import { CompletedSalahLogger } from "@/features/prayer-log";
import { QadaReminderPlans } from "@/features/qada";
import { ReminderScheduler } from "@/features/reminders";
import { AppProviders } from "@/shared/lib/app-providers";
import { applyOtaUpdate } from "@/shared/lib/hot-updater";
import { initMonitoring, withMonitoring } from "@/shared/lib/monitoring";
import { lockPortrait } from "@/shared/lib/orientation";
import { ModalCloseButton } from "@/shared/ui/modal-close-button";

initMonitoring();
// Runs in the background; failures are reported to Sentry.
void applyOtaUpdate();

export const unstable_settings = {
  anchor: "(tabs)",
};

const RootStack = () => {
  const { t } = useTranslation();
  // The manifest allows landscape; only the reader takes it up, on wide screens.
  useEffect(lockPortrait, []);
  const onboarded = useOnboarded();

  // Until the first run is over, onboarding is the only screen. A screen
  // pushed over the tabs shows only the back chevron: the tabs screen has no
  // title of its own, and its route name, "(tabs)", would label the button.
  return (
    <Stack screenOptions={{ headerBackButtonDisplayMode: "minimal" }}>
      <Stack.Protected guard={onboarded}>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen
          name="settings"
          options={{ headerShown: false, presentation: "modal" }}
        />
        <Stack.Screen
          name="account"
          options={{
            title: t("account"),
            presentation: "modal",
            headerRight: () => <ModalCloseButton />,
          }}
        />
        <Stack.Screen name="calendar" />
        <Stack.Screen name="insights" />
        <Stack.Screen name="qibla" />
        <Stack.Screen name="prayer-assistant" />
        <Stack.Screen name="quran" />
        <Stack.Screen name="date-converter" />
        <Stack.Screen name="khatmah" />
        <Stack.Screen name="khatmah-new" />
        <Stack.Screen name="qada" />
        <Stack.Screen name="qada-setup" />
        <Stack.Screen name="share-image" />
        <Stack.Screen name="debug-sentry" />
      </Stack.Protected>
      <Stack.Protected guard={!onboarded}>
        <Stack.Screen name="onboarding" options={{ headerShown: false }} />
      </Stack.Protected>
    </Stack>
  );
};

// Icon shortcuts and the links that wait for the first run to end.
const Links = () => <LinkShortcuts onboarded={useOnboarded()} />;

// The Khushu sheet is mounted once, above every tab, because a Salah can be
// ticked from Home or the Prayer tab, or logged when the Prayer Assistant
// finishes one (which the Prayer Log hears at the root).
const Layout = () => (
  <AppProviders>
    <HabitReminderPlans>
      {(habits) => (
        <QadaReminderPlans>
          {(qada) => (
            <KhatmahReminderPlans>
              {(khatmah) => (
                <WorshipMappingPlans>
                  {(worship) => (
                    <ReminderScheduler
                      habits={habits}
                      qada={qada}
                      khatmah={khatmah}
                      worship={worship}
                    />
                  )}
                </WorshipMappingPlans>
              )}
            </KhatmahReminderPlans>
          )}
        </QadaReminderPlans>
      )}
    </HabitReminderPlans>
    <UsageAnalytics />
    <CompanionAwards />
    <PushDeviceRegistration />
    <CompletedSalahLogger />
    <RootStack />
    <Links />
    <KhushuSheet />
  </AppProviders>
);

export default withMonitoring(Layout);
