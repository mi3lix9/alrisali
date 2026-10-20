import "../i18n";
import { qadaCalendar } from "@alrisali/domain/qada";
import type { QadaLog } from "@alrisali/domain/qada";
import { Text } from "panelui-native";
import { useTranslation } from "react-i18next";
import { View } from "react-native";
import type { Temporal } from "temporal-polyfill";

import { formatDateTime, formatNumber } from "@/shared/lib/numbers";

const WEEKS = 5;

/** How strongly a day is shaded for how much was made up on it. */
const shade = (count: number): string => {
  if (count === 0) {
    return "bg-muted";
  }
  if (count < 3) {
    return "bg-success/40";
  }
  if (count < 5) {
    return "bg-success/70";
  }
  return "bg-success";
};

/**
 * The Qada calendar: the last five weeks, each day shaded by the Qada items
 * made up on it, today outlined.
 */
export const QadaCalendar = ({
  logs,
  today,
}: {
  logs: readonly QadaLog[];
  today: Temporal.PlainDate;
}) => {
  const { t } = useTranslation("qada");
  const weeks = qadaCalendar(logs, today, WEEKS);

  return (
    <View className="gap-1" testID="qada-calendar">
      <View className="flex-row gap-1">
        {(weeks[0] ?? []).map(({ date }) => (
          <Text
            key={date.dayOfWeek}
            size="xs"
            muted
            numberOfLines={1}
            className="flex-1 text-center"
          >
            {formatDateTime(date, { weekday: "narrow" })}
          </Text>
        ))}
      </View>
      {weeks.map((week) => (
        <View key={week[0]?.date.toString()} className="flex-row gap-1">
          {week.map((day) => (
            <View
              key={day.date.toString()}
              accessible={!day.future}
              accessibilityLabel={t("dashboard.calendarDay", {
                date: formatDateTime(day.date, {
                  day: "numeric",
                  month: "long",
                }),
                n: formatNumber(day.count),
              })}
              className={`h-8 flex-1 items-center justify-center rounded-lg ${
                day.future ? "opacity-30" : shade(day.count)
              } ${day.date.equals(today) ? "border-foreground border-2" : ""}`}
            >
              <Text size="xs">{formatNumber(day.date.day)}</Text>
            </View>
          ))}
        </View>
      ))}
    </View>
  );
};
