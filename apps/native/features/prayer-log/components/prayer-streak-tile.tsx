import "../i18n";
import { SALAH } from "@alrisali/domain/shared";
import { router } from "expo-router";
import { useTranslation } from "react-i18next";

import { useToday } from "@/shared/lib/today";
import { WidgetTile } from "@/shared/ui/widget";

import { usePrayerLog } from "../hooks/use-prayer-log";

/**
 * Home's half-width Prayer Streak tile with today's count; opens the Prayer
 * tab, where the Prayer Log lives.
 */
export const PrayerStreakTile = () => {
  const { t } = useTranslation("prayer-log");
  const today = useToday();
  const view = usePrayerLog(today, today);
  const days = view ? t("streak.days", { count: view.streak.days }) : "—";

  return (
    <WidgetTile
      testID="prayer-streak"
      label={t("streak.label")}
      value={days}
      accessibilityLabel={`${t("streak.label")}: ${days}`}
      caption={
        view
          ? t("streak.today", {
              performed: view.log.performed.length,
              total: SALAH.length,
            })
          : undefined
      }
      onPress={() => router.navigate("/prayer")}
    />
  );
};
