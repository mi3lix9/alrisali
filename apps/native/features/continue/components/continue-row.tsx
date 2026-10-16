import "../i18n";
import { Text } from "panelui-native";
import type { ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { ScrollView, View } from "react-native";

/**
 * Home's Continue row: the places the Believer can resume, side by side and
 * scrolling sideways. Each child is a `ContinueTile` that hides itself when it
 * has nothing to resume.
 */
export const ContinueRow = ({ children }: { children: ReactNode }) => {
  const { t } = useTranslation("continue");

  return (
    <View className="gap-2">
      <Text weight="semibold">{t("title")}</Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerClassName="gap-4"
      >
        {children}
      </ScrollView>
    </View>
  );
};
