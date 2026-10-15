import "../i18n";
import { canLogDate } from "@alrisali/domain/prayer-log";
import { SALAH } from "@alrisali/domain/shared";
import type { Salah } from "@alrisali/domain/shared";
import { Button, Card, Checkbox, Text } from "panelui-native";
import { useState } from "react";
import type { ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { View } from "react-native";
import type { Temporal } from "temporal-polyfill";

import { launchLanguage } from "@/shared/lib/preferences";
import { useToday } from "@/shared/lib/today";

import { usePrayerLog } from "../hooks/use-prayer-log";
import { PrayerStreak } from "./prayer-streak";

const DATE_FORMAT: Intl.DateTimeFormatOptions = {
  weekday: "long",
  day: "numeric",
  month: "long",
  year: "numeric",
};

/** What another feature shows beside a logged Salah, composed by the route. */
type LoggedSalahActions = (date: Temporal.PlainDate, salah: Salah) => ReactNode;

interface PrayerLogCardProps {
  loggedSalahActions?: LoggedSalahActions | undefined;
}

/**
 * The Prayer tab's Prayer Log: tick each Salah for today or step back to
 * log or correct a past date. Future dates cannot be reached.
 */
export const PrayerLogCard = ({ loggedSalahActions }: PrayerLogCardProps) => {
  const { t } = useTranslation("prayer-log");
  const today = useToday();
  // null follows today, so the card moves on at midnight.
  const [picked, setPicked] = useState<Temporal.PlainDate | null>(null);
  const date = picked && canLogDate(picked, today) ? picked : today;
  const isToday = date.equals(today);
  const view = usePrayerLog(date, today);

  const showDate = (next: Temporal.PlainDate) =>
    setPicked(next.equals(today) ? null : next);

  return (
    <Card>
      <Card.Header>
        <Card.Title>{t("title")}</Card.Title>
        <Card.Description>{t("description")}</Card.Description>
      </Card.Header>
      <Card.Content className="gap-4">
        <View className="flex-row items-center justify-between gap-2">
          <Button
            variant="outline"
            size="sm"
            onPress={() => showDate(date.subtract({ days: 1 }))}
          >
            {t("previousDay")}
          </Button>
          <Text weight="medium" className="flex-1 text-center">
            {isToday
              ? t("today")
              : date.toLocaleString(launchLanguage, DATE_FORMAT)}
          </Text>
          <Button
            variant="outline"
            size="sm"
            disabled={isToday}
            onPress={() => showDate(date.add({ days: 1 }))}
          >
            {t("nextDay")}
          </Button>
        </View>
        {view ? (
          <>
            <View className="gap-3">
              {SALAH.map((salah) => {
                const performed = view.log.performed.includes(salah);
                return (
                  <View
                    key={salah}
                    className="min-h-9 flex-row items-center justify-between gap-2"
                  >
                    <Checkbox
                      checked={performed}
                      onCheckedChange={() => view.toggle(salah)}
                      label={t(`salah.${salah}`)}
                    />
                    {performed ? loggedSalahActions?.(date, salah) : null}
                  </View>
                );
              })}
            </View>
            {view.saveFailed ? (
              <Text className="text-destructive">{t("saveError")}</Text>
            ) : null}
            <PrayerStreak streak={view.streak} />
          </>
        ) : null}
      </Card.Content>
      {isToday ? null : (
        <Card.Footer>
          <Button variant="secondary" onPress={() => setPicked(null)}>
            {t("today")}
          </Button>
        </Card.Footer>
      )}
    </Card>
  );
};
