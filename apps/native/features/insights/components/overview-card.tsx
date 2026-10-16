import type { InsightsOverview } from "@alrisali/domain/insights";
import { MAX_KHUSHU_LEVEL } from "@alrisali/domain/shared";
import { Card, Text } from "panelui-native";
import { useTranslation } from "react-i18next";
import { View } from "react-native";

import { formatNumber, formatPercent } from "../utils/format";

/** One figure, read out as "label: value", with its note as the hint. */
const Stat = ({
  testID,
  label,
  value,
  note,
}: {
  testID: string;
  label: string;
  value: string;
  note?: string | undefined;
}) => (
  <View
    accessible
    testID={testID}
    accessibilityLabel={`${label}: ${value}`}
    accessibilityHint={note}
    className="min-w-[45%] flex-1 gap-1"
  >
    <Text muted size="sm">
      {label}
    </Text>
    <Text className="text-xl font-semibold">{value}</Text>
    {note ? (
      <Text muted size="sm">
        {note}
      </Text>
    ) : null}
  </View>
);

/** The week at a glance: Prayer Streak, Salah, Khushu and Habits. */
export const OverviewCard = ({ overview }: { overview: InsightsOverview }) => {
  const { t } = useTranslation("insights");
  const change = overview.khushuChange;
  let khushuNote: string | undefined;
  if (change !== null) {
    const value = formatNumber(Math.abs(change));
    if (change > 0) {
      khushuNote = t("overview.khushuUp", { value });
    } else if (change < 0) {
      khushuNote = t("overview.khushuDown", { value });
    } else {
      khushuNote = t("overview.khushuSame");
    }
  }

  return (
    <Card>
      <Card.Header>
        <Card.Title>{t("overview.title")}</Card.Title>
      </Card.Header>
      <Card.Content className="flex-row flex-wrap gap-4">
        <Stat
          testID="insights-prayer-streak"
          label={t("overview.prayerStreak")}
          value={t("overview.days", { count: overview.prayerStreak })}
          note={overview.todayComplete ? undefined : t("overview.streakHint")}
        />
        <Stat
          testID="insights-salah-logged"
          label={t("overview.salah")}
          value={t("overview.salahValue", {
            logged: formatNumber(overview.salahLogged),
            possible: formatNumber(overview.salahPossible),
          })}
        />
        <Stat
          testID="insights-khushu"
          label={t("overview.khushu")}
          value={
            overview.averageKhushu === null
              ? t("overview.noKhushu")
              : t("overview.khushuValue", {
                  value: formatNumber(overview.averageKhushu),
                  max: MAX_KHUSHU_LEVEL,
                })
          }
          note={khushuNote}
        />
        <Stat
          testID="insights-habits"
          label={t("overview.habits")}
          value={
            overview.habitCompletion === null
              ? t("overview.noHabits")
              : formatPercent(overview.habitCompletion)
          }
        />
      </Card.Content>
    </Card>
  );
};
