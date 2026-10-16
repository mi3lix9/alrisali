import "../i18n";
import { FEATURES, homeShortcuts } from "@alrisali/domain/shared";
import { router } from "expo-router";
import { Button, Text } from "panelui-native";
import { useTranslation } from "react-i18next";
import { View } from "react-native";

import { FEATURE_LINKS } from "@/shared/lib/features";
import { useHijriToday } from "@/shared/lib/hijri-today";
import { usePreferences } from "@/shared/lib/preferences";
import { FeatureIcon, SymbolIcon } from "@/shared/ui/feature-icon";

import { FeatureTile } from "./feature-tile";

/**
 * Home's shortcuts: the Believer's chosen features in their order (seasonal
 * ones only in season), four to a row, then a tile into All Tools.
 */
export const HomeShortcutsCard = () => {
  const { t } = useTranslation("shortcuts");
  const { t: tShell } = useTranslation();
  const layout = usePreferences((state) => state.homeShortcuts);
  const shortcuts = homeShortcuts(FEATURES, layout, useHijriToday());

  return (
    <View className="gap-2">
      <View className="flex-row items-center justify-between">
        <Text weight="semibold">{t("home.title")}</Text>
        <Button
          testID="shortcuts-edit"
          variant="ghost"
          size="sm"
          accessibilityLabel={t("home.editLabel")}
          onPress={() => router.push("/shortcuts")}
        >
          {t("home.edit")}
        </Button>
      </View>
      <View className="-m-1 flex-row flex-wrap">
        {shortcuts.map((feature) => (
          <View key={feature.id} className="w-1/4 p-1">
            <FeatureTile
              testID={`shortcuts-open-${feature.id}`}
              icon={<FeatureIcon feature={feature.id} />}
              label={tShell(`features.${feature.id}`)}
              href={FEATURE_LINKS[feature.id].href}
            />
          </View>
        ))}
        <View className="w-1/4 p-1">
          <FeatureTile
            testID="shortcuts-all-tools"
            icon={<SymbolIcon sf="square.grid.2x2" md="apps" />}
            label={t("home.allTools")}
            href="/tools"
          />
        </View>
      </View>
    </View>
  );
};
