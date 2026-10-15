import { Stack } from "expo-router";

/** The native stack inside one tab, titled with the tab's name. */
export const TabStack = ({ title }: { title: string }) => (
  <Stack screenOptions={{ headerLargeTitle: true }}>
    <Stack.Screen name="index" options={{ title }} />
  </Stack>
);
