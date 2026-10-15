import "../i18n";
import { SALAH } from "@alrisali/domain/shared";
import { Card, Chip, Text } from "panelui-native";
import { useTranslation } from "react-i18next";
import { View } from "react-native";

import { useToday } from "@/shared/lib/today";

import { usePrayerLog } from "../hooks/use-prayer-log";
import { PrayerStreak } from "./prayer-streak";

/** Home's quick ticks for today's Salah, with the Prayer Streak. */
export const PrayerLogQuickTicks = () => {
  const { t } = useTranslation("prayer-log");
  const today = useToday();
  const view = usePrayerLog(today, today);

  if (!view) {
    return null;
  }

  return (
    <Card>
      <Card.Header>
        <Card.Title>{t("title")}</Card.Title>
      </Card.Header>
      <Card.Content className="gap-4">
        <View className="flex-row flex-wrap gap-2">
          {SALAH.map((salah) => (
            <Chip
              key={salah}
              selected={view.log.performed.includes(salah)}
              haptics
              onPress={() => view.toggle(salah)}
            >
              {t(`salah.${salah}`)}
            </Chip>
          ))}
        </View>
        {view.saveFailed ? (
          <Text className="text-destructive">{t("saveError")}</Text>
        ) : null}
        <PrayerStreak streak={view.streak} />
      </Card.Content>
    </Card>
  );
};
