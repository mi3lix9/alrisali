import "../i18n";
import type { Location } from "@alrisali/domain/shared";
import { Button, Chip, DatePicker, Text } from "panelui-native";
import {
  CalendarIcon,
  ChevronDownIcon,
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

import { moveShownDay } from "../utils/day-navigation";

// The arrows point the way the text runs: in Arabic, onward is leftward.
const [PreviousIcon, NextIcon] =
  launchDirection === "rtl"
    ? [ChevronRightIcon, ChevronLeftIcon]
    : [ChevronLeftIcon, ChevronRightIcon];

// A place is saved as "City, Region, Country"; the chip shows the city.
const PLACE_SEPARATOR = /[,،]/u;
const WEEKDAY_DATE: Intl.DateTimeFormatOptions = {
  weekday: "long",
  day: "numeric",
  month: "long",
};

const toDate = (date: Temporal.PlainDate): Date =>
  new Date(date.year, date.month - 1, date.day);

const fromDate = (date: Date): Temporal.PlainDate =>
  Temporal.PlainDate.from({
    year: date.getFullYear(),
    month: date.getMonth() + 1,
    day: date.getDate(),
  });

/**
 * The top of the Prayer tab: the shown day in both calendars with arrows to
 * move between days, a Today chip while another day is shown, a date picker,
 * and a chip with the city that opens the location and options sheet. `shown`
 * is `null` for today.
 */
export const PrayerHeader = ({
  today,
  shown,
  location,
  onShow,
  onOpenSettings,
}: {
  today: Temporal.PlainDate | null;
  shown: Temporal.PlainDate | null;
  location: Location | null;
  onShow: (day: Temporal.PlainDate | null) => void;
  onOpenSettings: () => void;
}) => {
  const { t } = useTranslation("prayer-times");
  const calendar = useHijriCalendar();
  const formatHijriDate = useFormatHijriDate();
  const [picking, setPicking] = useState(false);

  let place = t("next.setLocation");
  if (location) {
    place =
      location.name?.split(PLACE_SEPARATOR)[0]?.trim() || t("location.unnamed");
  }
  const chip = (
    <Chip
      variant="outline"
      size="lg"
      testID="prayer-location-chip"
      accessibilityRole="button"
      accessibilityLabel={t("header.settings", { place })}
      onPress={onOpenSettings}
    >
      <Chip.Label>{place}</Chip.Label>
      <ChevronDownIcon size={14} />
    </Chip>
  );

  // Without a location there is no day to move between.
  if (!today) {
    return <View className="items-start">{chip}</View>;
  }
  const date = shown ?? today;
  const isToday = shown === null;

  return (
    <View className="gap-3">
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
          <Text weight="semibold" size="lg" testID="day-hijri">
            {formatHijriDate(calendar.toHijri(date))}
          </Text>
          <Text muted testID="day-gregorian">
            {formatGregorianDate(date, WEEKDAY_DATE)}
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
      <View className="flex-row flex-wrap items-center justify-center gap-2">
        {chip}
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
    </View>
  );
};
