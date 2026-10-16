import "../i18n";
import {
  CONVERTER_CALENDARS,
  convertedCalendars,
  swapCalendar,
} from "@alrisali/domain/shared";
import type { CalendarDate, ConverterCalendar } from "@alrisali/domain/shared";
import { setStringAsync } from "expo-clipboard";
import { router, Stack } from "expo-router";
import {
  Button,
  Card,
  Text,
  toast,
  ToggleButton,
  ToggleButtonGroup,
} from "panelui-native";
import {
  CalendarIcon,
  ChevronsUpDownIcon,
  CopyIcon,
  InfoIcon,
} from "panelui-native/icons";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Pressable, View } from "react-native";

import { formatDateTime } from "@/shared/lib/numbers";
import { useToday } from "@/shared/lib/today";
import { Screen } from "@/shared/ui/screen";

import { WheelColumn } from "../components/wheel-column";
import type { WheelItem } from "../components/wheel-column";
import {
  useCalendarFormat,
  useDateConverter,
} from "../hooks/use-date-converter";

const range = (first: number, last: number) =>
  Array.from({ length: last - first + 1 }, (_, offset) => first + offset);

const MONTHS = range(1, 12);

/**
 * Converts a day between Hijri, Gregorian and Shamsi: pick the source
 * calendar, turn its day, month and year wheels, and read the day in the
 * other calendars below. Swap makes the first of them the source. Hijri
 * Dates follow the effective Hijri Adjustment, as the calendar does.
 */
export const DateConverterScreen = () => {
  const { t } = useTranslation("calendar");
  const today = useToday();
  const converter = useDateConverter();
  const format = useCalendarFormat();
  const [source, setSource] = useState<ConverterCalendar>("hijri");
  const [date, setDate] = useState(today);

  const picked = converter.read(source, date);
  const years = converter.years(source);
  const pick = (part: Partial<CalendarDate>) =>
    setDate(converter.toDate(source, { ...picked, ...part }));

  const dayItems: WheelItem[] = range(
    1,
    converter.monthLength(source, picked.year, picked.month)
  ).map((value) => ({ value, label: format.number(value) }));
  const monthItems: WheelItem[] = MONTHS.map((value) => ({
    value,
    label: format.month(source, value),
  }));
  const yearItems: WheelItem[] = range(years.first, years.last).map(
    (value) => ({ value, label: format.number(value) })
  );

  const copy = async (text: string) => {
    await setStringAsync(text);
    toast.show({ variant: "success", label: t("converter.copied") });
  };

  return (
    <>
      <Stack.Screen
        options={{
          title: t("converter.title"),
          headerRight: () => (
            <Button
              testID="date-converter-today"
              variant="ghost"
              size="sm"
              onPress={() => setDate(today)}
            >
              {t("converter.today")}
            </Button>
          ),
        }}
      />
      <Screen>
        <Card>
          <Card.Content className="gap-3">
            <Text size="sm" muted>
              {t("converter.from")}
            </Text>
            <ToggleButtonGroup
              testID="date-converter-source"
              selectionMode="single"
              size="sm"
              accessibilityLabel={t("converter.from")}
              value={[source]}
              onValueChange={([next]) => {
                const chosen = CONVERTER_CALENDARS.find(
                  (calendar) => calendar === next
                );
                if (chosen) {
                  setSource(chosen);
                }
              }}
            >
              {CONVERTER_CALENDARS.map((calendar) => (
                <ToggleButton key={calendar} id={calendar}>
                  {t(`converter.calendars.${calendar}`)}
                </ToggleButton>
              ))}
            </ToggleButtonGroup>
            <View className="flex-row gap-1">
              <WheelColumn
                key={`${source}-day`}
                testID="date-converter-day"
                accessibilityLabel={t("converter.wheels.day")}
                items={dayItems}
                selected={picked.day}
                onChange={(day) => pick({ day })}
              />
              <View className="flex-[1.6]">
                <WheelColumn
                  key={`${source}-month`}
                  testID="date-converter-month"
                  accessibilityLabel={t("converter.wheels.month")}
                  items={monthItems}
                  selected={picked.month}
                  onChange={(month) => pick({ month })}
                />
              </View>
              <View className="flex-[1.2]">
                <WheelColumn
                  key={`${source}-year`}
                  testID="date-converter-year"
                  accessibilityLabel={t("converter.wheels.year")}
                  items={yearItems}
                  selected={picked.year}
                  onChange={(year) => pick({ year })}
                />
              </View>
            </View>
            <Text size="sm" muted className="text-center">
              {formatDateTime(date, { weekday: "long" })}
            </Text>
          </Card.Content>
        </Card>
        <View className="items-center">
          <Button
            testID="date-converter-swap"
            variant="primary"
            size="icon"
            className="rounded-full"
            accessibilityLabel={t("converter.swap")}
            onPress={() => setSource(swapCalendar(source))}
          >
            <ChevronsUpDownIcon size={20} />
          </Button>
        </View>
        <Card>
          <Card.Content className="gap-3">
            {convertedCalendars(source).map((calendar, order) => {
              const written = format.date(calendar, date);
              return (
                <View
                  key={calendar}
                  className={
                    order === 0 ? "gap-1" : "border-border gap-1 border-t pt-3"
                  }
                >
                  <Text size="sm" muted>
                    {t(`converter.calendars.${calendar}`)}
                  </Text>
                  <View className="flex-row items-center justify-between gap-2">
                    <Text
                      testID={`date-converter-result-${calendar}`}
                      size={order === 0 ? "xl" : "lg"}
                      weight="bold"
                      className="flex-1"
                    >
                      {written}
                    </Text>
                    <Button
                      variant="secondary"
                      size="icon"
                      accessibilityLabel={t("converter.copy", {
                        date: written,
                      })}
                      onPress={() => copy(written)}
                    >
                      <CopyIcon size={18} />
                    </Button>
                  </View>
                </View>
              );
            })}
          </Card.Content>
        </Card>
        <Card>
          <Card.Content className="gap-4">
            <Pressable
              testID="date-converter-open-calendar"
              accessibilityRole="link"
              className="flex-row items-center gap-3"
              onPress={() =>
                router.dismissTo({
                  pathname: "/calendar",
                  params: { date: date.toString() },
                })
              }
            >
              <CalendarIcon size={20} />
              <View className="flex-1">
                <Text weight="medium">{t("converter.openInCalendar")}</Text>
                <Text size="sm" muted>
                  {format.date("hijri", date)}
                </Text>
              </View>
            </Pressable>
            <View className="flex-row gap-3">
              <InfoIcon size={20} />
              <View className="flex-1">
                <Text weight="medium">{t("converter.hijriNote.title")}</Text>
                <Text size="sm" muted>
                  {t("converter.hijriNote.body")}
                </Text>
              </View>
            </View>
          </Card.Content>
        </Card>
      </Screen>
    </>
  );
};
