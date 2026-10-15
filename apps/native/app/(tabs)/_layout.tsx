import { NativeTabs } from "expo-router/native-tabs";
import { useTranslation } from "react-i18next";

import { launchDirection } from "@/shared/lib/i18n";

// The tab bar is UIKit's, which lays itself out from the app's native
// language rather than from React Native's forced RTL, so the direction is
// handed to it explicitly.
const TabsLayout = () => {
  const { t } = useTranslation();

  return (
    <NativeTabs unstable_nativeProps={{ direction: launchDirection }}>
      <NativeTabs.Trigger name="(home)">
        <NativeTabs.Trigger.Label>{t("tabs.home")}</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon sf="house" md="home" />
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="prayer">
        <NativeTabs.Trigger.Label>{t("tabs.prayer")}</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon sf="clock" md="schedule" />
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="library">
        <NativeTabs.Trigger.Label>{t("tabs.library")}</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon sf="books.vertical" md="local_library" />
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="worship">
        <NativeTabs.Trigger.Label>{t("tabs.worship")}</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon sf="sparkles" md="self_improvement" />
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="tasbih">
        <NativeTabs.Trigger.Label>{t("tabs.tasbih")}</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon sf="circle.dotted" md="blur_circular" />
      </NativeTabs.Trigger>
    </NativeTabs>
  );
};

export default TabsLayout;
