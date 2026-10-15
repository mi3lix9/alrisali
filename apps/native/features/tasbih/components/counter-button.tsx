import { Text } from "panelui-native";
import { useTranslation } from "react-i18next";
import { Pressable } from "react-native";

import { launchLanguage } from "@/shared/lib/preferences";

export const formatCount = (value: number): string =>
  value.toLocaleString(launchLanguage);

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
      ? formatCount(count)
      : t("counter.progress", {
          count: formatCount(count),
          target: formatCount(target),
        });

  return (
    <Pressable
      onPressIn={onTap}
      accessibilityRole="button"
      accessibilityLabel={t("counter.label")}
      accessibilityHint={t("counter.hint")}
      accessibilityValue={{ text: counted }}
      className="bg-card border-border size-64 items-center justify-center rounded-full border-4 active:opacity-80"
    >
      <Text className="text-7xl font-bold tabular-nums">
        {formatCount(count)}
      </Text>
      {target === null ? null : <Text muted>/ {formatCount(target)}</Text>}
    </Pressable>
  );
};
