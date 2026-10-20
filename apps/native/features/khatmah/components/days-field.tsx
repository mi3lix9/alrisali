import "../i18n";
import { MAX_EVEN_DAYS, MIN_EVEN_DAYS } from "@alrisali/domain/khatmah";
import { Button, Input, Text } from "panelui-native";
import { useTranslation } from "react-i18next";
import { View } from "react-native";

import { formatNumber, parseNumber } from "@/shared/lib/numbers";

const clamp = (days: number): number =>
  Math.min(MAX_EVEN_DAYS, Math.max(MIN_EVEN_DAYS, days));

/** The even split's number of days: − and +, and the number, which can be typed. */
export const DaysField = ({
  value,
  onChange,
}: {
  value: number;
  onChange: (days: number) => void;
}) => {
  const { t } = useTranslation("khatmah");
  return (
    <View className="flex-row items-center gap-2">
      <Text weight="medium" className="flex-1">
        {t("plan.days")}
      </Text>
      <Button
        variant="outline"
        size="sm"
        accessibilityLabel={t("plan.decrease")}
        disabled={value <= MIN_EVEN_DAYS}
        onPress={() => onChange(clamp(value - 1))}
      >
        −
      </Button>
      <View className="w-20">
        <Input
          testID="khatmah-days"
          accessibilityLabel={t("plan.days")}
          keyboardType="number-pad"
          value={formatNumber(value, { useGrouping: false })}
          onChangeText={(text) => {
            const typed = parseNumber(text);
            onChange(
              Number.isFinite(typed) ? clamp(Math.round(typed)) : MIN_EVEN_DAYS
            );
          }}
          className="text-center"
        />
      </View>
      <Button
        variant="outline"
        size="sm"
        accessibilityLabel={t("plan.increase")}
        disabled={value >= MAX_EVEN_DAYS}
        onPress={() => onChange(clamp(value + 1))}
      >
        +
      </Button>
    </View>
  );
};
