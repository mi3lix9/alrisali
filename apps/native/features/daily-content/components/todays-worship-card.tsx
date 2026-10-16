import "../i18n";
import { getBook } from "@alrisali/content/books";
import type { SupplicationEntry } from "@alrisali/content/books";
import { todaysWorship } from "@alrisali/domain/daily-content";
import { router } from "expo-router";
import { Card, Item, Text } from "panelui-native";
import { useTranslation } from "react-i18next";

import { launchLanguage } from "@/shared/lib/preferences";
import { useToday } from "@/shared/lib/today";

import { useDailyContent } from "../data/daily-content";
import { useWorshipMapping } from "../data/worship-mapping";

interface Row {
  entry: SupplicationEntry;
  label: "dua" | "ziyarah" | "everyDay" | "tonight";
}

/**
 * Home's today's worship: the weekday's dua and ziyarah, the every-day
 * items, and from Maghrib tonight's dua (Kumayl on Thursday night), each one
 * tap into the reader. The texts are bundled, so they open offline; hidden
 * when Admins mapped nothing for today.
 */
export const TodaysWorshipCard = ({
  afterMaghrib,
}: {
  /** From Maghrib at the Believer's location, tonight's dua is offered. */
  afterMaghrib: boolean;
}) => {
  const { t } = useTranslation("dailyContent");
  const weekdayDuas = useDailyContent();
  const mapping = useWorshipMapping();
  const today = useToday();

  const worship = todaysWorship({
    weekdayDuas: weekdayDuas.data ?? [],
    entries: mapping.data ?? [],
    today,
    afterMaghrib,
  });
  const rows: Row[] = [
    ...worship.tonight.map((entry) => ({ entry, label: "tonight" as const })),
    ...(worship.dua ? [{ entry: worship.dua, label: "dua" as const }] : []),
    ...worship.ziyarah.map((entry) => ({ entry, label: "ziyarah" as const })),
    ...worship.everyDay.map((entry) => ({ entry, label: "everyDay" as const })),
  ];

  if (rows.length === 0) {
    return null;
  }

  return (
    <Card>
      <Card.Header>
        <Card.Title>{t("title")}</Card.Title>
      </Card.Header>
      <Card.Content>
        {rows.map(({ entry, label }) => (
          <Item
            key={`${label}-${entry.id}`}
            testID={`todays-worship-${label}-${entry.id}`}
            accessibilityLabel={`${t(`kind.${label}`)}, ${entry.title[launchLanguage]}`}
            onPress={() =>
              router.push({
                pathname: "/library/supplication/[id]",
                params: { id: entry.id },
              })
            }
          >
            <Text muted size="sm">
              {t(`kind.${label}`)}
            </Text>
            <Text weight="semibold">{entry.title[launchLanguage]}</Text>
            <Text muted size="xs">
              {getBook(entry.bookId)?.title[launchLanguage]}
            </Text>
          </Item>
        ))}
      </Card.Content>
    </Card>
  );
};
