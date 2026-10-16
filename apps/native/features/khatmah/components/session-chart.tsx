import "../i18n";
import type { KhatmahSessionRow } from "@alrisali/domain/khatmah";
import { Text } from "panelui-native";
import { useTranslation } from "react-i18next";
import { View } from "react-native";

import { formatNumber } from "@/shared/lib/numbers";

const BAR_HEIGHT = 72;

/** The pages of each session as a bar, done ones filled. */
export const SessionChart = ({
  rows,
}: {
  rows: readonly KhatmahSessionRow[];
}) => {
  const { t } = useTranslation("khatmahProgress");
  const tallest = Math.max(1, ...rows.map(({ pages }) => pages));

  return (
    <View className="gap-2" testID="khatmah-session-chart">
      <Text muted size="sm">
        {t("history.chart")}
      </Text>
      <View className="flex-row items-end gap-px">
        {rows.map((row) => (
          <View
            key={row.number}
            accessible
            accessibilityLabel={t("history.bar", {
              session: formatNumber(row.number),
              pages: formatNumber(row.pages),
            })}
            className={
              row.state === "done"
                ? "bg-primary flex-1 rounded-sm"
                : "bg-muted flex-1 rounded-sm"
            }
            style={{ height: (BAR_HEIGHT * row.pages) / tallest }}
          />
        ))}
      </View>
    </View>
  );
};
