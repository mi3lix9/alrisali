import { TABS, visibleTabs } from "@alrisali/domain/shared";
import { NativeTabs } from "expo-router/native-tabs";
import { useTranslation } from "react-i18next";

import { FEATURE_LINKS } from "@/shared/lib/features";
import { launchDirection } from "@/shared/lib/i18n";
import { usePreferences } from "@/shared/lib/preferences";

// The tab bar is UIKit's, which lays itself out from the app's native
// language rather than from React Native's forced RTL, so the direction is
// handed to it explicitly.
//
// The tabs are the Feature Registry's tab features. Tabs the Believer hid in
// Settings are hidden at once; Home never is.
const TabsLayout = () => {
  const { t } = useTranslation();
  const shown = visibleTabs(usePreferences((state) => state.hiddenTabs));

  return (
    <NativeTabs unstable_nativeProps={{ direction: launchDirection }}>
      {TABS.map((tab) => {
        const { tabRoute, icon } = FEATURE_LINKS[tab];
        return (
          <NativeTabs.Trigger
            key={tab}
            name={tabRoute}
            testID={`tabs-${tab}`}
            hidden={!shown.includes(tab)}
          >
            <NativeTabs.Trigger.Label>
              {t(`features.${tab}`)}
            </NativeTabs.Trigger.Label>
            <NativeTabs.Trigger.Icon sf={icon.sf} md={icon.md} />
          </NativeTabs.Trigger>
        );
      })}
    </NativeTabs>
  );
};

export default TabsLayout;
