import {
  HEATMAP_DAYS,
  INSIGHTS_WEEK_DAYS,
  MAX_HEATMAP_LEVEL,
} from "@alrisali/domain/insights";
import type { HeatmapDay } from "@alrisali/domain/insights";
import { Card, Text } from "panelui-native";
import { useTranslation } from "react-i18next";
import { View } from "react-native";

const DAYS_PER_WEEK = 7;
const LEVELS = Array.from(
  { length: MAX_HEATMAP_LEVEL + 1 },
  (_, level) => level
);

/** A heatmap square's tint: empty days stay muted. */
const Square = ({ level }: { level: number }) => (
  <View
    className={`aspect-square w-full rounded-sm ${level === 0 ? "bg-muted" : "bg-primary"}`}
    style={level === 0 ? undefined : { opacity: level / MAX_HEATMAP_LEVEL }}
  />
);

/**
 * The last 84 days, a column per week, oldest first. Each row is one weekday,
 * since the period is a whole number of weeks.
 */
export const HeatmapCard = ({
  heatmap,
}: {
  heatmap: readonly HeatmapDay[];
}) => {
  const { t } = useTranslation("insights");
  const weeks = Array.from(
    { length: Math.ceil(heatmap.length / DAYS_PER_WEEK) },
    (_, week) => heatmap.slice(week * DAYS_PER_WEEK, (week + 1) * DAYS_PER_WEEK)
  );

  return (
    <Card>
      <Card.Header>
        <Card.Title>
          {t("heatmap.title", { weeks: HEATMAP_DAYS / INSIGHTS_WEEK_DAYS })}
        </Card.Title>
        <Card.Description>{t("heatmap.description")}</Card.Description>
      </Card.Header>
      <Card.Content className="gap-3">
        <View className="flex-row gap-1">
          {weeks.map((days) => (
            <View key={days[0]?.date.toString()} className="flex-1 gap-1">
              {days.map((day) => (
                <Square key={day.date.toString()} level={day.level} />
              ))}
            </View>
          ))}
        </View>
        <View className="flex-row items-center justify-end gap-1">
          <Text muted size="sm">
            {t("heatmap.less")}
          </Text>
          {LEVELS.map((level) => (
            <View key={level} className="w-3">
              <Square level={level} />
            </View>
          ))}
          <Text muted size="sm">
            {t("heatmap.more")}
          </Text>
        </View>
      </Card.Content>
    </Card>
  );
};
