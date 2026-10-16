import { Stack } from "expo-router";
import { useTranslation } from "react-i18next";

import "@/features/announcements";
import "@/features/settings";
import { ModalCloseButton } from "@/shared/ui/modal-close-button";

// The Settings modal has its own stack, so Sources & Credits, Privacy,
// Terms and Contact open inside it.
const SettingsLayout = () => {
  const { t: tShell } = useTranslation();
  const { t } = useTranslation("settings");
  const { t: tAnnouncements } = useTranslation("announcements");

  return (
    <Stack>
      <Stack.Screen
        name="index"
        options={{
          title: tShell("settings"),
          headerRight: () => <ModalCloseButton />,
        }}
      />
      <Stack.Screen
        name="reminders"
        options={{ title: t("reminders.title") }}
      />
      <Stack.Screen
        name="announcements"
        options={{ title: tAnnouncements("title") }}
      />
      <Stack.Screen
        name="prayer"
        options={{ title: t("prayerSettings.title") }}
      />
      <Stack.Screen name="sources" options={{ title: t("sources.title") }} />
      <Stack.Screen name="privacy" options={{ title: t("about.privacy") }} />
      <Stack.Screen name="terms" options={{ title: t("about.terms") }} />
      <Stack.Screen name="contact" options={{ title: t("about.contact") }} />
    </Stack>
  );
};

export default SettingsLayout;
