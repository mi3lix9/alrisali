import { Button, Text } from "panelui-native";
import { HeadingIcon, MicIcon } from "panelui-native/icons";
import type { ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { View } from "react-native";

import { SafeAreaView } from "@/shared/ui/safe-area-view";

const Tool = ({
  label,
  icon,
  selected,
  testID,
  onPress,
}: {
  label: string;
  icon: ReactNode;
  selected?: boolean;
  testID: string;
  onPress: () => void;
}) => (
  <Button
    variant={selected ? "secondary" : "ghost"}
    testID={testID}
    accessibilityLabel={label}
    accessibilityState={selected === undefined ? undefined : { selected }}
    className="h-auto flex-col gap-0.5 px-3 py-1.5"
    onPress={onPress}
  >
    {icon}
    <Text size="sm">{label}</Text>
  </Button>
);

/**
 * The Supplication reader's always-visible bottom toolbar: Format, Recite-Along
 * (when the route offers it) and the route's own actions for the Supplication,
 * such as mark as read and favourite, at its end.
 */
export const ReaderToolbar = ({
  reciting,
  onFormat,
  onToggleRecite,
  actions,
}: {
  reciting: boolean;
  onFormat: () => void;
  /** Offers Recite-Along when given. */
  onToggleRecite: (() => void) | undefined;
  actions: ReactNode;
}) => {
  const { t } = useTranslation("books");

  return (
    <SafeAreaView
      edges={["bottom"]}
      className="border-border bg-background border-t px-2 pt-1"
    >
      <View
        accessibilityRole="toolbar"
        accessibilityLabel={t("reader.toolbar.label")}
        className="flex-row items-center gap-1"
      >
        <Tool
          testID="books-reader-format"
          label={t("reader.toolbar.format")}
          icon={<HeadingIcon size={22} />}
          onPress={onFormat}
        />
        {onToggleRecite ? (
          <Tool
            testID="books-reader-recite"
            label={t("reader.view.recite")}
            icon={<MicIcon size={22} />}
            selected={reciting}
            onPress={onToggleRecite}
          />
        ) : null}
        <View className="flex-1 flex-row items-center justify-end gap-1">
          {actions}
        </View>
      </View>
    </SafeAreaView>
  );
};
