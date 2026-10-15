import type {
  HabitStreakInsight,
  TasbihTotal,
} from "@alrisali/domain/insights";
import type { TFunction } from "i18next";
import { Card, Text } from "panelui-native";
import { useTranslation } from "react-i18next";
import { View } from "react-native";

import { ar } from "../i18n/ar";
import { formatNumber, isLabelled } from "../utils/format";

const Row = ({ label, detail }: { label: string; detail: string }) => (
  <View className="flex-row items-center justify-between gap-3">
    <Text className="flex-1">{label}</Text>
    <Text muted>{detail}</Text>
  </View>
);

/** Each active Habit's current and longest streak. */
export const HabitStreaksCard = ({
  streaks,
}: {
  streaks: readonly HabitStreakInsight[];
}) => {
  const { t } = useTranslation("insights");

  return (
    <Card>
      <Card.Header>
        <Card.Title>{t("habits.title")}</Card.Title>
      </Card.Header>
      <Card.Content className="gap-3">
        {streaks.length === 0 ? <Text muted>{t("habits.empty")}</Text> : null}
        {streaks.map((streak) => (
          <Row
            key={streak.habitId}
            label={
              streak.preset !== null &&
              isLabelled(ar.habits.preset, streak.preset)
                ? t(`habits.preset.${streak.preset}`)
                : (streak.name ?? "")
            }
            detail={t("habits.streak", {
              current: formatNumber(streak.current),
              longest: formatNumber(streak.longest),
            })}
          />
        ))}
      </Card.Content>
    </Card>
  );
};

const tasbihName = (
  { tasbih }: TasbihTotal,
  t: TFunction<"insights">
): string => {
  switch (tasbih.kind) {
    case "tasbih-al-zahra": {
      return t("tasbih.tasbihAlZahra");
    }
    case "open": {
      return tasbih.name;
    }
    default: {
      return t("tasbih.removed");
    }
  }
};

/** Everything counted on each Tasbih, across its Dhikr Sessions. */
export const TasbihTotalsCard = ({
  totals,
}: {
  totals: readonly TasbihTotal[];
}) => {
  const { t } = useTranslation("insights");

  return (
    <Card>
      <Card.Header>
        <Card.Title>{t("tasbih.title")}</Card.Title>
      </Card.Header>
      <Card.Content className="gap-3">
        {totals.length === 0 ? <Text muted>{t("tasbih.empty")}</Text> : null}
        {totals.map((total) => (
          <View key={total.tasbihId} className="gap-0.5">
            <Row
              label={tasbihName(total, t)}
              detail={formatNumber(total.total)}
            />
            <Text muted size="sm">
              {t("tasbih.sessions", {
                sessions: formatNumber(total.sessions),
              })}
            </Text>
          </View>
        ))}
      </Card.Content>
    </Card>
  );
};
