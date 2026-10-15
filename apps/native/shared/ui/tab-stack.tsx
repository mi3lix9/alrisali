import { Stack } from "expo-router";

import { launchDirection } from "@/shared/lib/i18n";

// UIKit lays itself out left to right (the app's native language), and the
// headers are turned right to left by forcing the navigation bar's semantic
// content attribute. Under that forced direction iOS mirrors the large
// title's drawing: "Ab" comes out as "dA" and Arabic letters reversed and
// disjoined. The inline title is drawn correctly, so right-to-left launches
// use it.
const largeTitle = launchDirection === "ltr";

/** The native stack inside one tab, titled with the tab's name. */
export const TabStack = ({ title }: { title: string }) => (
  <Stack screenOptions={{ headerLargeTitle: largeTitle }}>
    <Stack.Screen name="index" options={{ title }} />
  </Stack>
);
