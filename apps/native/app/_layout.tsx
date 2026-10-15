import "@/global.css";
import { Stack } from "expo-router";

import { AppProviders } from "@/shared/lib/app-providers";
import { initMonitoring, withMonitoring } from "@/shared/lib/monitoring";

initMonitoring();

export const unstable_settings = {
  initialRouteName: "(tabs)",
};

const RootStack = () => (
  <Stack>
    <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
    <Stack.Screen
      name="settings"
      options={{ headerShown: false, presentation: "modal" }}
    />
  </Stack>
);

const Layout = () => (
  <AppProviders>
    <RootStack />
  </AppProviders>
);

export default withMonitoring(Layout);
