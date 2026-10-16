import { Text } from "panelui-native";
import { useTranslation } from "react-i18next";
import { Pressable } from "react-native";

import { formatNumber } from "@/shared/lib/numbers";

/**
 * The large circle the Believer taps to count. It counts on press-in, so a
 * fast thumb never waits for the release.
 */
export const CounterButton = ({
  count,
  target,
  onTap,
}: {
  count: number;
  target: number | null;
  onTap: () => void;
}) => {
  const { t } = useTranslation("tasbih");
  const counted =
    target === null
      ? formatNumber(count)
      : t("counter.progress", {
          count: formatNumber(count),
          target: formatNumber(target),
        });

  return (
    <Pressable
      onPressIn={onTap}
      testID="tasbih-counter"
      accessibilityRole="button"
      accessibilityLabel={t("counter.label")}
      accessibilityHint={t("counter.hint")}
      accessibilityValue={{ text: counted }}
      className="bg-card border-border size-64 items-center justify-center rounded-full border-4 active:opacity-80"
    >
      <Text className="text-7xl font-bold tabular-nums">
        {formatNumber(count)}
      </Text>
      {target === null ? null : <Text muted>/ {formatNumber(target)}</Text>}
    </Pressable>
  );
};
