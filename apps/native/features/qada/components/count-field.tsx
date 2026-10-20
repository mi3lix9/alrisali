import "../i18n";
import { Button, Input, Text } from "panelui-native";
import { useTranslation } from "react-i18next";
import { View } from "react-native";

import { formatNumber, parseNumber } from "@/shared/lib/numbers";

/**
 * One count in the Qada setup: a label, − and + by `step`, and the number
 * itself, which can be typed. Stays within `min` and `max`.
 */
export const CountField = ({
  label,
  description,
  value,
  onChange,
  step,
  min,
  max,
  testID,
}: {
  label: string;
  description?: string | undefined;
  value: number;
  onChange: (value: number) => void;
  step: number;
  min: number;
  max: number;
  testID: string;
}) => {
  const { t } = useTranslation("qada");
  const clamp = (next: number) => Math.min(max, Math.max(min, next));

  return (
    <View className="flex-row items-center gap-2">
      <View className="flex-1">
        <Text weight="medium">{label}</Text>
        {description ? (
          <Text size="sm" muted>
            {description}
          </Text>
        ) : null}
      </View>
      <Button
        variant="outline"
        size="sm"
        accessibilityLabel={t("setup.decrease", { name: label })}
        disabled={value <= min}
        onPress={() => onChange(clamp(value - step))}
      >
        −
      </Button>
      <View className="w-20">
        <Input
          testID={testID}
          accessibilityLabel={label}
          keyboardType="number-pad"
          value={formatNumber(value, { useGrouping: false })}
          onChangeText={(text) => {
            const typed = parseNumber(text);
            onChange(Number.isFinite(typed) ? clamp(Math.round(typed)) : min);
          }}
          className="text-center"
        />
      </View>
      <Button
        variant="outline"
        size="sm"
        accessibilityLabel={t("setup.increase", { name: label })}
        disabled={value >= max}
        onPress={() => onChange(clamp(value + step))}
      >
        +
      </Button>
    </View>
  );
};
