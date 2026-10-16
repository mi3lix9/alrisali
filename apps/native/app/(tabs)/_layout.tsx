import { visibleTabs } from "@alrisali/domain/shared";
import { NativeTabs } from "expo-router/native-tabs";
import { useTranslation } from "react-i18next";

import { launchDirection } from "@/shared/lib/i18n";
import { usePreferences } from "@/shared/lib/preferences";

// The tab bar is UIKit's, which lays itself out from the app's native
// language rather than from React Native's forced RTL, so the direction is
// handed to it explicitly.
//
// Tabs the Believer hid in Settings are hidden at once; Home never is.
const TabsLayout = () => {
  const { t } = useTranslation();
  const shown = visibleTabs(usePreferences((state) => state.hiddenTabs));

  return (
    <NativeTabs unstable_nativeProps={{ direction: launchDirection }}>
      <NativeTabs.Trigger name="(home)" testID="tabs-home">
        <NativeTabs.Trigger.Label>{t("tabs.home")}</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon sf="house" md="home" />
      </NativeTabs.Trigger>
      <NativeTabs.Trigger
        name="prayer"
        testID="tabs-prayer"
        hidden={!shown.includes("prayer")}
      >
        <NativeTabs.Trigger.Label>{t("tabs.prayer")}</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon sf="clock" md="schedule" />
      </NativeTabs.Trigger>
      <NativeTabs.Trigger
        name="library"
        testID="tabs-library"
        hidden={!shown.includes("library")}
      >
        <NativeTabs.Trigger.Label>{t("tabs.library")}</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon sf="books.vertical" md="local_library" />
      </NativeTabs.Trigger>
      <NativeTabs.Trigger
        name="worship"
        testID="tabs-worship"
        hidden={!shown.includes("worship")}
      >
        <NativeTabs.Trigger.Label>{t("tabs.worship")}</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon sf="sparkles" md="self_improvement" />
      </NativeTabs.Trigger>
      <NativeTabs.Trigger
        name="tasbih"
        testID="tabs-tasbih"
        hidden={!shown.includes("tasbih")}
      >
        <NativeTabs.Trigger.Label>{t("tabs.tasbih")}</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon sf="circle.dotted" md="blur_circular" />
      </NativeTabs.Trigger>
    </NativeTabs>
  );
};

export default TabsLayout;
