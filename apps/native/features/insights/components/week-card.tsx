import { INSIGHTS_WEEK_DAYS } from "@alrisali/domain/insights";
import type { InsightsDay } from "@alrisali/domain/insights";
import { SALAH } from "@alrisali/domain/shared";
import { Card, Text } from "panelui-native";
import { useTranslation } from "react-i18next";
import { View } from "react-native";

import { formatDateTime } from "@/shared/lib/numbers";

import { formatNumber } from "../utils/format";

const BAR_HEIGHT = 96;

/** Salah logged on each of the last 7 days, as bars. */
export const WeekCard = ({ week }: { week: readonly InsightsDay[] }) => {
  const { t } = useTranslation("insights");

  return (
    <Card>
      <Card.Header>
        <Card.Title>{t("week.title", { days: INSIGHTS_WEEK_DAYS })}</Card.Title>
        <Card.Description>{t("week.description")}</Card.Description>
      </Card.Header>
      <Card.Content className="flex-row items-end justify-between gap-2">
        {week.map((day) => {
          const weekday = formatDateTime(day.date, { weekday: "short" });
          return (
            <View
              key={day.date.toString()}
              accessible
              accessibilityLabel={t("week.day", {
                day: formatDateTime(day.date, { weekday: "long" }),
                salah: formatNumber(day.salah),
                possible: SALAH.length,
              })}
              className="flex-1 items-center gap-1"
            >
              <Text muted size="sm">
                {formatNumber(day.salah)}
              </Text>
              <View
                className="bg-muted w-full justify-end overflow-hidden rounded-md"
                style={{ height: BAR_HEIGHT }}
              >
                <View
                  className="bg-primary w-full"
                  style={{ height: (BAR_HEIGHT * day.salah) / SALAH.length }}
                />
              </View>
              <Text muted size="sm">
                {weekday}
              </Text>
            </View>
          );
        })}
      </Card.Content>
    </Card>
  );
};
