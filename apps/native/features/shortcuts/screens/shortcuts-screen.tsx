import "../i18n";
import { arrangedShortcuts, FEATURES } from "@alrisali/domain/shared";
import type { FeatureEntry } from "@alrisali/domain/shared";
import { Stack } from "expo-router";
import { Switch, Text } from "panelui-native";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { ScrollView, View } from "react-native";

import { useFormatHijriMonthDay } from "@/shared/lib/hijri-calendar";
import { usePreferences } from "@/shared/lib/preferences";
import { FeatureIcon } from "@/shared/ui/feature-icon";
import { ReorderableList } from "@/shared/ui/reorderable-list";

const ROW_HEIGHT = 64;

/**
 * The Home shortcuts editor: every feature that can be a shortcut, seasonal
 * ones too (with their season), each shown or hidden by a switch and
 * reordered by dragging. Each change is saved at once.
 */
export const ShortcutsScreen = () => {
  const { t } = useTranslation("shortcuts");
  const { t: tShell } = useTranslation();
  const formatMonthDay = useFormatHijriMonthDay();
  const layout = usePreferences((state) => state.homeShortcuts);
  const setShortcutShown = usePreferences((state) => state.setShortcutShown);
  const moveShortcut = usePreferences((state) => state.moveShortcut);
  const [dragging, setDragging] = useState(false);
  const shortcuts = arrangedShortcuts(FEATURES, layout);

  return (
    <ScrollView
      className="bg-background flex-1"
      contentContainerClassName="gap-4 p-4"
      contentInsetAdjustmentBehavior="automatic"
      scrollEnabled={!dragging}
    >
      <Stack.Screen options={{ title: t("editor.title") }} />
      <Text size="sm" muted>
        {t("editor.hint")}
      </Text>
      <ReorderableList
        items={shortcuts}
        keyOf={({ feature }) => feature.id}
        rowHeight={ROW_HEIGHT}
        onMove={moveShortcut}
        onDraggingChange={setDragging}
        labels={{ moveUp: t("editor.moveUp"), moveDown: t("editor.moveDown") }}
        renderRow={({ feature, shown }, accessibility) => {
          const label = tShell(`features.${feature.id}`);
          // No feature is seasonal yet, so read the window as any entry's.
          const { window }: FeatureEntry = feature;
          const season = window
            ? t("editor.season", {
                start: formatMonthDay(window.start),
                end: formatMonthDay(window.end),
              })
            : null;
          return (
            <View
              className="border-border h-full flex-row items-center gap-3 border-b"
              testID={`shortcuts-row-${feature.id}`}
            >
              <FeatureIcon feature={feature.id} />
              <View className="flex-1" accessible {...accessibility}>
                <Text numberOfLines={1}>{label}</Text>
                {season ? (
                  <Text size="xs" muted numberOfLines={1}>
                    {season}
                  </Text>
                ) : null}
              </View>
              <Switch
                label={label}
                value={shown}
                onValueChange={(next) => setShortcutShown(feature.id, next)}
              />
            </View>
          );
        }}
      />
    </ScrollView>
  );
};
