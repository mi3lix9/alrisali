import { nextPrayerTime } from "@alrisali/domain/shared";
import { Button, Card, DatePicker, Text } from "panelui-native";
import {
  CalendarIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
} from "panelui-native/icons";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { View } from "react-native";
import { Temporal } from "temporal-polyfill";

import {
  formatGregorianDate,
  useFormatHijriDate,
  useHijriCalendar,
} from "@/shared/lib/hijri-calendar";
import { launchDirection } from "@/shared/lib/i18n";
import { launchLanguage } from "@/shared/lib/preferences";

import { useNow } from "../hooks/use-now";
import type { PrayerTimesView } from "../hooks/use-prayer-times-settings";
import { moveShownDay } from "../utils/day-navigation";
import { formatCountdown } from "../utils/format";

const SECOND_MS = 1000;

// The arrows point the way the text runs: in Arabic, onward is leftward.
const [PreviousIcon, NextIcon] =
  launchDirection === "rtl"
    ? [ChevronRightIcon, ChevronLeftIcon]
    : [ChevronLeftIcon, ChevronRightIcon];

const toDate = (date: Temporal.PlainDate): Date =>
  new Date(date.year, date.month - 1, date.day);

const fromDate = (date: Date): Temporal.PlainDate =>
  Temporal.PlainDate.from({
    year: date.getFullYear(),
    month: date.getMonth() + 1,
    day: date.getDate(),
  });

const Countdown = ({
  view,
}: {
  view: PrayerTimesView & {
    settings: NonNullable<PrayerTimesView["settings"]>;
  };
}) => {
  const { t } = useTranslation("prayer-times");
  const now = useNow(SECOND_MS);
  const next = nextPrayerTime(now, view.settings, view.hidden);
  if (!next) {
    return null;
  }
  return (
    <Text
      testID="day-countdown"
      weight="semibold"
      className="text-center"
      style={{ fontVariant: ["tabular-nums"] }}
    >
      {t("day.countdown", {
        name: t(`names.${next.name}`),
        countdown: formatCountdown(
          next.at.toInstant().since(now).total("seconds")
        ),
      })}
    </Text>
  );
};

/**
 * Moves the Prayer screen between days: previous and next, a Today chip
 * while another day is shown, and a date picker. It names the shown day in
 * both calendars; the countdown to the next Prayer Time shows only for today.
 * `shown` is `null` for today.
 */
export const DayNavigationCard = ({
  view,
  today,
  shown,
  onShow,
}: {
  view: PrayerTimesView & {
    settings: NonNullable<PrayerTimesView["settings"]>;
  };
  today: Temporal.PlainDate;
  shown: Temporal.PlainDate | null;
  onShow: (day: Temporal.PlainDate | null) => void;
}) => {
  const { t } = useTranslation("prayer-times");
  const calendar = useHijriCalendar();
  const formatHijriDate = useFormatHijriDate();
  const [picking, setPicking] = useState(false);
  const date = shown ?? today;
  const isToday = shown === null;

  return (
    <Card>
      <Card.Header>
        <View className="flex-row items-center justify-between gap-2">
          <Button
            testID="day-previous"
            variant="ghost"
            size="icon"
            accessibilityLabel={t("day.previous")}
            onPress={() => onShow(moveShownDay(shown, today, -1))}
          >
            <PreviousIcon size={20} />
          </Button>
          <View className="flex-1 items-center">
            <Card.Title testID="day-hijri">
              {formatHijriDate(calendar.toHijri(date))}
            </Card.Title>
            <Text size="sm" muted testID="day-gregorian">
              {formatGregorianDate(date)}
            </Text>
          </View>
          <Button
            testID="day-next"
            variant="ghost"
            size="icon"
            accessibilityLabel={t("day.next")}
            onPress={() => onShow(moveShownDay(shown, today, 1))}
          >
            <NextIcon size={20} />
          </Button>
        </View>
      </Card.Header>
      <Card.Content className="gap-3">
        {isToday ? <Countdown view={view} /> : null}
        <View className="flex-row items-center justify-center gap-2">
          {isToday ? null : (
            <Button
              testID="day-today"
              variant="outline"
              size="sm"
              onPress={() => {
                setPicking(false);
                onShow(null);
              }}
            >
              {t("day.today")}
            </Button>
          )}
          <Button
            testID="day-pick"
            variant="ghost"
            size="sm"
            startContent={<CalendarIcon size={16} />}
            onPress={() => setPicking((open) => !open)}
          >
            {t("day.pick")}
          </Button>
        </View>
        {picking ? (
          <DatePicker
            selected={toDate(date)}
            onSelect={(selected) => {
              if (selected) {
                const day = fromDate(selected);
                onShow(day.equals(today) ? null : day);
                setPicking(false);
              }
            }}
            locale={launchLanguage}
          />
        ) : null}
      </Card.Content>
    </Card>
  );
};
