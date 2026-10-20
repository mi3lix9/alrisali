import "../i18n";
import { amalOfMonth } from "@alrisali/domain/books";
import { HIJRI_MONTHS } from "@alrisali/domain/shared";
import type { HijriMonth } from "@alrisali/domain/shared";
import { Stack } from "expo-router";
import {
  Badge,
  Card,
  Chip,
  Item,
  Text,
  ToggleButton,
  ToggleButtonGroup,
} from "panelui-native";
import {
  ChevronDownIcon,
  ChevronUpIcon,
  RepeatIcon,
} from "panelui-native/icons";
import { useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { ScrollView } from "react-native";
import type { ScrollViewInstance } from "react-native";

import {
  formatGregorianDate,
  useFormatHijriDate,
  useHijriMonthName,
  useFormatHijriMonthDay,
  useHijriCalendar,
} from "@/shared/lib/hijri-calendar";
import { formatNumber } from "@/shared/lib/numbers";
import { useToday } from "@/shared/lib/today";
import { Screen } from "@/shared/ui/screen";

import { AmalEntryRow } from "../components/amal-entry-row";
import { useAmal } from "../data/amal";

const AMAL_TABS = ["specific", "general"] as const;
type AmalTab = (typeof AMAL_TABS)[number];

/** Keeps the chosen month chip clear of the screen's edge. */
const CHIP_SCROLL_MARGIN = 16;

/**
 * The a'mal of each Hijri month. It opens at today's month with today's day
 * expanded; the whole month's a'mal (day 0) are listed apart, under General.
 */
export const AmalScreen = () => {
  const { t } = useTranslation("books");
  const calendar = useHijriCalendar();
  const today = calendar.toHijri(useToday());
  const formatMonth = useHijriMonthName();
  const formatHijriDate = useFormatHijriDate();
  const formatMonthDay = useFormatHijriMonthDay();
  const [month, setMonth] = useState<HijriMonth>(today.month);
  const [tab, setTab] = useState<AmalTab>("specific");
  const [open, setOpen] = useState<ReadonlySet<number>>(
    () => new Set([today.day])
  );
  const months = useRef<ScrollViewInstance>(null);
  const amal = useAmal();

  const { wholeMonth, days } = amalOfMonth(month, amal);
  // The month's next start: this year's if it has not ended, else next year's.
  const year = month >= today.month ? today.year : today.year + 1;
  const length = calendar.monthLength(year, month);

  const chooseMonth = (next: HijriMonth) => {
    setMonth(next);
    setOpen(new Set(next === today.month ? [today.day] : []));
  };

  const toggleDay = (day: number) => {
    const next = new Set(open);
    if (next.has(day)) {
      next.delete(day);
    } else {
      next.add(day);
    }
    setOpen(next);
  };

  return (
    <Screen>
      <Stack.Screen options={{ title: t("amal.title") }} />
      <ScrollView
        ref={months}
        horizontal
        showsHorizontalScrollIndicator={false}
        accessibilityLabel={t("amal.months")}
        contentContainerClassName="gap-2"
        className="grow-0"
      >
        {HIJRI_MONTHS.map((option) => (
          <Chip
            key={option}
            size="lg"
            variant={option === month ? "primary" : "outline"}
            selected={option === month}
            testID={`amal-month-${option}`}
            onPress={() => chooseMonth(option)}
            onLayout={
              option === today.month
                ? ({ nativeEvent }) =>
                    months.current?.scrollTo({
                      x: Math.max(0, nativeEvent.layout.x - CHIP_SCROLL_MARGIN),
                      animated: false,
                    })
                : undefined
            }
          >
            {option === today.month
              ? t("amal.current", { month: formatMonth(option) })
              : formatMonth(option)}
          </Chip>
        ))}
      </ScrollView>

      <Card>
        <Card.Header>
          <Card.Title testID="amal-month-title">
            {formatHijriDate({ year, month })}
          </Card.Title>
          <Card.Description>
            {formatGregorianDate(calendar.toGregorian({ year, month, day: 1 }))}
          </Card.Description>
        </Card.Header>
      </Card>

      <ToggleButtonGroup
        selectionMode="single"
        size="sm"
        accessibilityLabel={t("amal.tabs.label")}
        value={[tab]}
        onValueChange={([next]) => {
          const chosen = AMAL_TABS.find((option) => option === next);
          if (chosen) {
            setTab(chosen);
          }
        }}
      >
        {AMAL_TABS.map((option) => (
          <ToggleButton key={option} id={option} testID={`amal-tab-${option}`}>
            {t(`amal.tabs.${option}`)}
          </ToggleButton>
        ))}
      </ToggleButtonGroup>

      {tab === "general" ? (
        <>
          <Text muted size="sm">
            {t("amal.generalHint")}
          </Text>
          {wholeMonth.length === 0 ? (
            <Text muted testID="amal-empty-general">
              {t("amal.emptyGeneral")}
            </Text>
          ) : (
            <Card>
              <Card.Content>
                <Item.Group>
                  {wholeMonth.map((entry) => (
                    <AmalEntryRow
                      key={`${entry.time ?? ""}-${entry.supplicationId}`}
                      entry={entry}
                    />
                  ))}
                </Item.Group>
              </Card.Content>
            </Card>
          )}
        </>
      ) : (
        <>
          {wholeMonth.length > 0 ? (
            <Item
              variant="outline"
              size="sm"
              testID="amal-whole-month"
              onPress={() => setTab("general")}
            >
              <Item.Media variant="icon">
                <RepeatIcon />
              </Item.Media>
              <Item.Content>
                <Item.Title>{t("amal.wholeMonth")}</Item.Title>
                <Item.Description>
                  {t("amal.wholeMonthCount", { count: wholeMonth.length })}
                </Item.Description>
              </Item.Content>
            </Item>
          ) : null}
          {days.length === 0 ? (
            <Text muted testID="amal-empty-month">
              {t("amal.emptyMonth")}
            </Text>
          ) : null}
          {days.map(({ day, entries }) => {
            const expanded = open.has(day);
            const isToday = month === today.month && day === today.day;
            return (
              <Card key={day}>
                <Card.Content>
                  <Item.Group>
                    <Item
                      size="sm"
                      testID={`amal-day-${day}`}
                      accessibilityState={{ expanded }}
                      onPress={() => toggleDay(day)}
                    >
                      <Item.Media variant="icon">
                        <Text weight="semibold">{formatNumber(day)}</Text>
                      </Item.Media>
                      <Item.Content>
                        <Item.Title>
                          {formatMonthDay({ month, day })}
                        </Item.Title>
                        {day <= length ? (
                          <Item.Description>
                            {formatGregorianDate(
                              calendar.toGregorian({ year, month, day })
                            )}
                          </Item.Description>
                        ) : null}
                      </Item.Content>
                      <Item.Actions>
                        {isToday ? (
                          <Badge size="sm">{t("amal.today")}</Badge>
                        ) : null}
                        <Text muted size="sm">
                          {formatNumber(entries.length)}
                        </Text>
                        {expanded ? (
                          <ChevronUpIcon size={16} />
                        ) : (
                          <ChevronDownIcon size={16} />
                        )}
                      </Item.Actions>
                    </Item>
                    {expanded
                      ? entries.map((entry) => (
                          <AmalEntryRow
                            key={`${entry.time ?? ""}-${entry.supplicationId}`}
                            entry={entry}
                          />
                        ))
                      : null}
                  </Item.Group>
                </Card.Content>
              </Card>
            );
          })}
        </>
      )}
    </Screen>
  );
};
