import "../i18n";
import { FEATURES, featuresByArea } from "@alrisali/domain/shared";
import { Stack } from "expo-router";
import { Text } from "panelui-native";
import { useTranslation } from "react-i18next";
import { View } from "react-native";

import { FEATURE_LINKS } from "@/shared/lib/features";
import { useHijriToday } from "@/shared/lib/hijri-today";
import { FeatureIcon } from "@/shared/ui/feature-icon";
import { Screen } from "@/shared/ui/screen";

import { FeatureTile } from "../components/feature-tile";

/**
 * Every feature the Believer can reach today, grouped by area, three to a
 * row: the way to all of them without a sixth tab.
 */
export const AllToolsScreen = () => {
  const { t } = useTranslation("shortcuts");
  const { t: tShell } = useTranslation();
  const groups = featuresByArea(FEATURES, useHijriToday());

  return (
    <Screen>
      <Stack.Screen options={{ title: t("allTools.title") }} />
      {groups.map(({ area, features }) => (
        <View key={area} className="gap-2" testID={`all-tools-${area}`}>
          <Text weight="semibold" accessibilityRole="header">
            {tShell(`featureAreas.${area}`)}
          </Text>
          <View className="-m-1 flex-row flex-wrap">
            {features.map((feature) => (
              <View key={feature.id} className="w-1/3 p-1">
                <FeatureTile
                  testID={`all-tools-open-${feature.id}`}
                  icon={<FeatureIcon feature={feature.id} size={28} />}
                  label={tShell(`features.${feature.id}`)}
                  href={FEATURE_LINKS[feature.id].href}
                />
              </View>
            ))}
          </View>
        </View>
      ))}
    </Screen>
  );
};
