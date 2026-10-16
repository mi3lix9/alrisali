import "../i18n";
import type { InsightsSourceReaders } from "@alrisali/db-user/shared";
import { insights } from "@alrisali/domain/insights";
import { Stack } from "expo-router";
import { Spinner, Text } from "panelui-native";
import { useTranslation } from "react-i18next";
import { View } from "react-native";

import { useToday } from "@/shared/lib/today";
import { Screen } from "@/shared/ui/screen";

import { DistractionsCard, MoodsCard } from "../components/breakdown-cards";
import { HeatmapCard } from "../components/heatmap-card";
import { OverviewCard } from "../components/overview-card";
import { HabitStreaksCard, TasbihTotalsCard } from "../components/totals-cards";
import { WeekCard } from "../components/week-card";
import { useInsightsSources } from "../data/insights";

/**
 * The Believer's Insights, worked out on the device from their own records,
 * so they need no account and no connection. The route passes each
 * feature's reader in as `readers`.
 */
export const InsightsScreen = ({
  readers,
}: {
  readers: InsightsSourceReaders;
}) => {
  const { t } = useTranslation("insights");
  const today = useToday();
  const { data: sources, isError } = useInsightsSources(readers);
  const found = sources ? insights(sources, today) : null;

  let body = (
    <View className="bg-background flex-1 items-center justify-center p-4">
      {isError ? (
        <Text className="text-destructive">{t("loadError")}</Text>
      ) : (
        <Spinner />
      )}
    </View>
  );
  if (found) {
    body = (
      <Screen>
        <Text muted size="sm">
          {t("privacy")}
        </Text>
        <OverviewCard overview={found.overview} />
        <WeekCard week={found.week} />
        <HeatmapCard heatmap={found.heatmap} />
        <HabitStreaksCard streaks={found.habitStreaks} />
        <TasbihTotalsCard totals={found.tasbihTotals} />
        <MoodsCard moods={found.moods} />
        <DistractionsCard distractions={found.distractions} />
      </Screen>
    );
  }

  return (
    <>
      <Stack.Screen options={{ title: t("title") }} />
      {body}
    </>
  );
};
