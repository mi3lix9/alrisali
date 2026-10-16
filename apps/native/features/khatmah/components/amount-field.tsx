import "../i18n";
import { AMOUNT_LIMITS, AMOUNT_UNITS } from "@alrisali/domain/khatmah";
import type { AmountUnit } from "@alrisali/domain/khatmah";
import { Chip, Text } from "panelui-native";
import { useTranslation } from "react-i18next";
import { View } from "react-native";

import { StepperField } from "./stepper-field";

/** The by-amount plan: the unit a session is counted in, and how many of it. */
export const AmountField = ({
  unit,
  count,
  onChange,
}: {
  unit: AmountUnit;
  count: number;
  onChange: (next: { unit: AmountUnit; count: number }) => void;
}) => {
  const { t } = useTranslation("khatmah");
  const { min, max } = AMOUNT_LIMITS[unit];
  return (
    <View className="gap-3">
      <Text weight="medium">{t("plan.amount.unit")}</Text>
      <View className="flex-row flex-wrap gap-2">
        {AMOUNT_UNITS.map((option) => (
          <Chip
            key={option}
            size="lg"
            testID={`khatmah-amount-unit-${option}`}
            variant={option === unit ? "primary" : "outline"}
            selected={option === unit}
            onPress={() =>
              onChange({
                unit: option,
                count: Math.min(
                  AMOUNT_LIMITS[option].max,
                  Math.max(AMOUNT_LIMITS[option].min, count)
                ),
              })
            }
          >
            {t(`plan.amount.units.${option}`)}
          </Chip>
        ))}
      </View>
      <StepperField
        testID="khatmah-amount-count"
        label={t("plan.amount.count")}
        value={count}
        min={min}
        max={max}
        onChange={(next) => onChange({ unit, count: next })}
        decreaseLabel={t("plan.amount.decrease")}
        increaseLabel={t("plan.amount.increase")}
      />
    </View>
  );
};
