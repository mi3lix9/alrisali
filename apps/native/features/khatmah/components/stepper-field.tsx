import { Button, Input, Text } from "panelui-native";
import { View } from "react-native";

import { formatNumber, parseNumber } from "@/shared/lib/numbers";

/** A whole number between `min` and `max`: − and +, and the number, which can be typed. */
export const StepperField = ({
  label,
  value,
  min,
  max,
  onChange,
  decreaseLabel,
  increaseLabel,
  testID,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  onChange: (value: number) => void;
  decreaseLabel: string;
  increaseLabel: string;
  testID: string;
}) => {
  const clamp = (next: number): number => Math.min(max, Math.max(min, next));
  return (
    <View className="flex-row items-center gap-2">
      <Text weight="medium" className="flex-1">
        {label}
      </Text>
      <Button
        variant="outline"
        size="sm"
        accessibilityLabel={decreaseLabel}
        disabled={value <= min}
        onPress={() => onChange(clamp(value - 1))}
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
        accessibilityLabel={increaseLabel}
        disabled={value >= max}
        onPress={() => onChange(clamp(value + 1))}
      >
        +
      </Button>
    </View>
  );
};
