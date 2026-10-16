import "../i18n";
import { SESSION_INTERVALS } from "@alrisali/domain/khatmah";
import type { SessionInterval } from "@alrisali/domain/khatmah";
import { Text, ToggleButton, ToggleButtonGroup } from "panelui-native";
import { useTranslation } from "react-i18next";
import { View } from "react-native";

import { formatNumber } from "@/shared/lib/numbers";

import { StepperField } from "./stepper-field";

/**
 * How often sessions fall (daily, every other day, weekly) and, when
 * `joinTotal` is given, the session to join at.
 */
export const ScheduleField = ({
  every,
  onEveryChange,
  join,
  joinTotal,
  onJoinChange,
}: {
  every: SessionInterval;
  onEveryChange: (every: SessionInterval) => void;
  join: number;
  joinTotal: number | null;
  onJoinChange: (session: number) => void;
}) => {
  const { t } = useTranslation("khatmah");
  return (
    <View className="gap-3">
      <Text weight="semibold">{t("plan.schedule.title")}</Text>
      <ToggleButtonGroup
        testID="khatmah-schedule"
        selectionMode="single"
        size="sm"
        accessibilityLabel={t("plan.schedule.every")}
        value={[String(every)]}
        onValueChange={([next]) => {
          const chosen = SESSION_INTERVALS.find(
            (interval) => String(interval) === next
          );
          if (chosen) {
            onEveryChange(chosen);
          }
        }}
      >
        {SESSION_INTERVALS.map((interval) => (
          <ToggleButton key={interval} id={String(interval)}>
            {t(`plan.schedule.options.${interval}`)}
          </ToggleButton>
        ))}
      </ToggleButtonGroup>
      {joinTotal === null || joinTotal < 2 ? null : (
        <View className="gap-1">
          <StepperField
            testID="khatmah-join"
            label={t("plan.schedule.join")}
            value={join}
            min={1}
            max={joinTotal}
            onChange={onJoinChange}
            decreaseLabel={t("plan.amount.decrease")}
            increaseLabel={t("plan.amount.increase")}
          />
          <Text size="sm" muted>
            {t("plan.schedule.joinValue", {
              n: formatNumber(join),
              total: formatNumber(joinTotal),
            })}
          </Text>
          <Text size="sm" muted>
            {t("plan.schedule.joinHint")}
          </Text>
        </View>
      )}
    </View>
  );
};
