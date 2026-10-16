import "../i18n";
import {
  addHijriMonths,
  HIJRI_MONTHS,
  occasionsInMonth,
  occasionsOn,
} from "@alrisali/domain/shared";
import type { HijriYearMonth } from "@alrisali/domain/shared";
import { Stack, useLocalSearchParams } from "expo-router";
import { Button, Card, Text } from "panelui-native";
import { ChevronLeftIcon, ChevronRightIcon } from "panelui-native/icons";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { View } from "react-native";
import { Temporal } from "temporal-polyfill";

import {
  formatGregorianDate,
  useFormatHijriDate,
  useHijriCalendar,
} from "@/shared/lib/hijri-calendar";
import { Screen } from "@/shared/ui/screen";

import { DateConverterButton } from "../components/date-converter-button";
import { HijriMonthGridView } from "../components/hijri-month-grid";
import { OccasionList } from "../components/occasion-list";
import { useOccasions } from "../data/occasions";
import { parseDay } from "../utils/parse-day";

const GREGORIAN_MONTH = { month: "short", year: "numeric" } as const;

/**
 * A Hijri month at a time: the grid with Gregorian days alongside, the chosen
 * day's Occasions, then every Occasion of the month.
 */
export const CalendarScreen = () => {
  const { t } = useTranslation("calendar");
  const calendar = useHijriCalendar();
  const formatHijriDate = useFormatHijriDate();
  const occasions = useOccasions();
  const today = Temporal.Now.plainDateISO();
  const [selected, setSelected] = useState(today);
  // The month on screen, as an offset from today's, so it follows a change
  // of the Hijri Adjustment.
  const [monthOffset, setMonthOffset] = useState(0);

  const todayHijri = calendar.toHijri(today);
  const shown: HijriYearMonth = addHijriMonths(todayHijri, monthOffset);
  const grid = calendar.monthGrid(shown.year, shown.month);
  const selectedHijri = calendar.toHijri(selected);
  const selectedLength = calendar.monthLength(
    selectedHijri.year,
    selectedHijri.month
  );
  const first = grid.days[0]?.date ?? today;
  const last = grid.days.at(-1)?.date ?? today;

  // The date converter opens a day here (`?date=2026-10-15`): show its month.
  const { date } = useLocalSearchParams<{ date?: string }>();
  const [opened, setOpened] = useState<string>();
  if (date !== opened) {
    setOpened(date);
    const day = parseDay(date);
    if (day) {
      const hijri = calendar.toHijri(day);
      setSelected(day);
      setMonthOffset(
        (hijri.year - todayHijri.year) * HIJRI_MONTHS.length +
          hijri.month -
          todayHijri.month
      );
    }
  }

  const showMonth = (offset: number) => {
    setMonthOffset(offset);
    const month = addHijriMonths(todayHijri, offset);
    setSelected(
      offset === 0 ? today : calendar.toGregorian({ ...month, day: 1 })
    );
  };

  return (
    <>
      <Stack.Screen
        options={{
          title: t("title"),
          headerRight: () => <DateConverterButton />,
        }}
      />
      <Screen>
        <Card>
          <Card.Header>
            <View className="flex-row items-center justify-between gap-2">
              <Button
                variant="ghost"
                size="icon"
                accessibilityLabel={t("month.previous")}
                onPress={() => showMonth(monthOffset - 1)}
              >
                <ChevronLeftIcon size={20} />
              </Button>
              <View className="flex-1 items-center">
                <Card.Title>{formatHijriDate(shown)}</Card.Title>
                <Text size="sm" muted>
                  {`${formatGregorianDate(first, GREGORIAN_MONTH)} – ${formatGregorianDate(last, GREGORIAN_MONTH)}`}
                </Text>
              </View>
              <Button
                variant="ghost"
                size="icon"
                accessibilityLabel={t("month.next")}
                onPress={() => showMonth(monthOffset + 1)}
              >
                <ChevronRightIcon size={20} />
              </Button>
            </View>
          </Card.Header>
          <Card.Content>
            <HijriMonthGridView
              grid={grid}
              occasions={occasions}
              today={today}
              selected={selected}
              onSelect={setSelected}
            />
          </Card.Content>
          {monthOffset === 0 ? null : (
            <Card.Footer>
              <Button variant="outline" onPress={() => showMonth(0)}>
                {t("month.backToToday")}
              </Button>
            </Card.Footer>
          )}
        </Card>
        <Card>
          <Card.Header>
            <Card.Title>{formatHijriDate(selectedHijri)}</Card.Title>
            <Card.Description>{formatGregorianDate(selected)}</Card.Description>
          </Card.Header>
          <Card.Content>
            <OccasionList
              occasions={occasionsOn(selectedHijri, selectedLength, occasions)}
              empty={t("day.noOccasions")}
            />
          </Card.Content>
        </Card>
        <Card>
          <Card.Header>
            <Card.Title>{t("monthOccasions")}</Card.Title>
          </Card.Header>
          <Card.Content className="gap-4">
            {occasionsInMonth(grid.month, grid.length, occasions).map(
              ({ day, occasions: onDay }) => (
                <View key={day} className="gap-2">
                  <Text size="sm" muted>
                    {`${formatHijriDate({ ...shown, day })} — ${formatGregorianDate(
                      calendar.toGregorian({ ...shown, day })
                    )}`}
                  </Text>
                  <OccasionList occasions={onDay} empty="" />
                </View>
              )
            )}
          </Card.Content>
        </Card>
      </Screen>
    </>
  );
};
