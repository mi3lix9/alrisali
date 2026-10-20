import type { KhatmahInsights } from "@alrisali/domain/insights";
import { Card, Text } from "panelui-native";
import { useTranslation } from "react-i18next";
import { View } from "react-native";

import { formatDateTime } from "@/shared/lib/numbers";

import { formatNumber } from "../utils/format";

const BAR_HEIGHT = 72;

/** Completed Khatmahs, and the pages of each session of the newest one. */
export const KhatmahCard = ({ khatmah }: { khatmah: KhatmahInsights }) => {
  const { t } = useTranslation("insights");
  const tallest = Math.max(1, ...khatmah.chart.map(({ pages }) => pages));

  return (
    <Card testID="insights-khatmah">
      <Card.Header>
        <Card.Title>{t("khatmah.title")}</Card.Title>
        <Card.Description>
          {t("khatmah.completed", {
            n: formatNumber(khatmah.completed.length),
          })}
        </Card.Description>
      </Card.Header>
      <Card.Content className="gap-3">
        {khatmah.completed.length === 0 ? (
          <Text muted>{t("khatmah.empty")}</Text>
        ) : null}
        {khatmah.completed.map((entry) => (
          <Text key={entry.khatmahId}>
            {t("khatmah.entry", {
              date: formatDateTime(entry.completedOn, {
                day: "numeric",
                month: "short",
                year: "numeric",
              }),
              days: formatNumber(entry.days),
            })}
          </Text>
        ))}
        {khatmah.chart.length > 0 ? (
          <>
            <Text muted size="sm">
              {t("khatmah.chart")}
            </Text>
            <View className="flex-row items-end gap-px">
              {khatmah.chart.map((bar) => (
                <View
                  key={bar.session}
                  accessible
                  accessibilityLabel={t("khatmah.bar", {
                    session: formatNumber(bar.session),
                    pages: formatNumber(bar.pages),
                  })}
                  className="bg-primary flex-1 rounded-sm"
                  style={{ height: (BAR_HEIGHT * bar.pages) / tallest }}
                />
              ))}
            </View>
          </>
        ) : null}
      </Card.Content>
    </Card>
  );
};
