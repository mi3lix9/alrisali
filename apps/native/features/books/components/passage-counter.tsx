import { counterProgress } from "@alrisali/domain/books";
import { Button, Text } from "panelui-native";
import { useTranslation } from "react-i18next";
import { View } from "react-native";

import { formatNumber } from "@/shared/lib/numbers";

import type { ReaderColors } from "../utils/reader-theme";

/**
 * A tap counter under a passage that asks for a phrase to be repeated: tap to
 * count towards the target, hold the count past it freely, reset to start over.
 */
export const PassageCounter = ({
  count,
  target,
  colors,
  onTap,
  onReset,
}: {
  count: number;
  target: number;
  colors: ReaderColors | undefined;
  onTap: () => void;
  onReset: () => void;
}) => {
  const { t } = useTranslation("books");
  const done = counterProgress(count, target) === 1;
  const ink = colors ? { color: colors.text } : undefined;

  return (
    <View className="flex-row items-center gap-2 pb-3">
      <Button
        variant={done ? "secondary" : "primary"}
        testID="books-counter-tap"
        accessibilityLabel={t("reader.counter.tap", {
          count: formatNumber(count),
          target: formatNumber(target),
        })}
        onPress={onTap}
      >
        <Text>
          {t("reader.counter.progress", {
            count: formatNumber(count),
            target: formatNumber(target),
          })}
        </Text>
      </Button>
      {count > 0 ? (
        <Button
          variant="ghost"
          testID="books-counter-reset"
          accessibilityLabel={t("reader.counter.reset")}
          onPress={onReset}
        >
          <Text style={ink}>{t("reader.counter.reset")}</Text>
        </Button>
      ) : null}
    </View>
  );
};
