import {
  AUTO_SCROLL_SPEEDS,
  stepAutoScrollSpeed,
} from "@alrisali/domain/books";
import { useKeepAwake } from "expo-keep-awake";
import { Button, Text } from "panelui-native";
import { MinusIcon, PlusIcon } from "panelui-native/icons";
import { useTranslation } from "react-i18next";
import { View } from "react-native";

import { formatNumber } from "@/shared/lib/numbers";

/** Keeps the screen on while auto-scroll runs. */
const KeepAwake = () => {
  useKeepAwake("books-auto-scroll");
  return null;
};

/** The speed control shown above the toolbar while auto-scroll is on. */
export const AutoScrollBar = ({
  speed,
  onSpeed,
}: {
  speed: number;
  onSpeed: (speed: number) => void;
}) => {
  const { t } = useTranslation("books");

  return (
    <View
      testID="books-auto-scroll-bar"
      className="border-border bg-background flex-row items-center justify-center gap-3 border-t px-4 py-1"
    >
      <KeepAwake />
      <Text size="sm" muted>
        {t("reader.autoScroll.speed")}
      </Text>
      <Button
        variant="ghost"
        size="sm"
        testID="books-auto-scroll-slower"
        accessibilityLabel={t("reader.autoScroll.slower")}
        disabled={speed <= 1}
        onPress={() => onSpeed(stepAutoScrollSpeed(speed, -1))}
      >
        <MinusIcon size={20} />
      </Button>
      <Text
        accessibilityLabel={t("reader.autoScroll.speedValue", {
          speed: formatNumber(speed),
          max: formatNumber(AUTO_SCROLL_SPEEDS.length),
        })}
      >
        {formatNumber(speed)}
      </Text>
      <Button
        variant="ghost"
        size="sm"
        testID="books-auto-scroll-faster"
        accessibilityLabel={t("reader.autoScroll.faster")}
        disabled={speed >= AUTO_SCROLL_SPEEDS.length}
        onPress={() => onSpeed(stepAutoScrollSpeed(speed, 1))}
      >
        <PlusIcon size={20} />
      </Button>
    </View>
  );
};
