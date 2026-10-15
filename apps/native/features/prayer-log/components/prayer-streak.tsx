import type { DisplayedPrayerStreak } from "@alrisali/domain/shared";
import { Text } from "panelui-native";
import { useTranslation } from "react-i18next";
import { View } from "react-native";

/**
 * The Prayer Streak shown today (yesterday's run until today is complete),
 * with a nudge while today is incomplete.
 */
export const PrayerStreak = ({ streak }: { streak: DisplayedPrayerStreak }) => {
  const { t } = useTranslation("prayer-log");
  const days = t("streak.days", { count: streak.days });

  return (
    <View
      accessible
      accessibilityLabel={`${t("streak.label")}: ${days}`}
      testID="prayer-streak"
      className="gap-1"
    >
      <Text muted>{t("streak.label")}</Text>
      <Text size="2xl" weight="bold">
        {days}
      </Text>
      {streak.todayComplete ? null : <Text muted>{t("streak.hint")}</Text>}
    </View>
  );
};
