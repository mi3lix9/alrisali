import { Stack } from "expo-router";
import { useTranslation } from "react-i18next";

import "@/features/settings";

// The Settings modal has its own stack, so Sources & Credits, Privacy and
// Terms open inside it.
const SettingsLayout = () => {
  const { t: tShell } = useTranslation();
  const { t } = useTranslation("settings");

  return (
    <Stack>
      <Stack.Screen name="index" options={{ title: tShell("settings") }} />
      <Stack.Screen name="sources" options={{ title: t("sources.title") }} />
      <Stack.Screen name="privacy" options={{ title: t("about.privacy") }} />
      <Stack.Screen name="terms" options={{ title: t("about.terms") }} />
    </Stack>
  );
};

export default SettingsLayout;
