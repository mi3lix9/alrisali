import "@/global.css";
import { Stack } from "expo-router";
import { useTranslation } from "react-i18next";

import { AppProviders } from "@/shared/lib/app-providers";
import { initMonitoring, withMonitoring } from "@/shared/lib/monitoring";

initMonitoring();

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
        options={{ title: t("settings"), presentation: "modal" }}
      />
    </Stack>
  );
};

const Layout = () => (
  <AppProviders>
    <RootStack />
  </AppProviders>
);

export default withMonitoring(Layout);
