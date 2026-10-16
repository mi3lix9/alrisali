import { gatheringMonth, gatheringsOn } from "@alrisali/domain/gatherings";
import type {
  Gathering,
  GatheringDay,
  Speaker,
} from "@alrisali/domain/gatherings";
import { Card, Text } from "panelui-native";
import { useTranslation } from "react-i18next";
import { Pressable, View } from "react-native";
import type { Temporal } from "temporal-polyfill";

import {
  formatGregorianDate,
  useFormatHijriDate,
  useHijriCalendar,
} from "@/shared/lib/hijri-calendar";
import { formatNumber } from "@/shared/lib/numbers";

import { useFormatDay } from "../hooks/use-format-day";
import { GatheringList } from "./gathering-list";
import { PeriodStepper } from "./period-stepper";

/** Column headings for weeks that start on Saturday (the domain's default). */
const WEEKDAYS = ["sat", "sun", "mon", "tue", "wed", "thu", "fri"] as const;
/** More Gatherings than this on a day show as this many dots. */
const MAX_DOTS = 3;
const MONTH_YEAR: Intl.DateTimeFormatOptions = {
  month: "long",
  year: "numeric",
};

const DayCell = ({
  day,
  isToday,
  isSelected,
  onSelect,
}: {
  day: GatheringDay;
  isToday: boolean;
  isSelected: boolean;
  onSelect: (date: Temporal.PlainDate) => void;
}) => {
  const { t } = useTranslation("gatherings");
  const count = day.gatherings.length;
  let frame = "";
  if (isSelected) {
    frame = "bg-primary";
  } else if (isToday) {
    frame = "border border-primary";
  }
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected: isSelected }}
      accessibilityLabel={`${formatGregorianDate(day.date)} — ${t("month.count", { count })}`}
      className={`flex-1 items-center gap-0.5 rounded-lg py-1.5 ${frame}`}
      onPress={() => onSelect(day.date)}
    >
      <Text
        weight="semibold"
        className={isSelected ? "text-primary-foreground" : ""}
      >
        {formatNumber(day.date.day)}
      </Text>
      <View className="h-1.5 flex-row gap-0.5">
        {day.gatherings.slice(0, MAX_DOTS).map((gathering) => (
          <View
            key={gathering.id}
            className={`h-1.5 w-1.5 rounded-full ${isSelected ? "bg-primary-foreground" : "bg-primary"}`}
          />
        ))}
      </View>
    </Pressable>
  );
};

/**
 * A Gregorian month grid with a dot per Gathering on each day; the chosen
 * day's Gatherings follow.
 */
export const MonthView = ({
  gatherings,
  speakers,
  date,
  today,
  onDateChange,
}: {
  gatherings: readonly Gathering[];
  speakers: ReadonlyMap<string, Speaker>;
  date: Temporal.PlainDate;
  today: Temporal.PlainDate;
  onDateChange: (date: Temporal.PlainDate) => void;
}) => {
  const { t } = useTranslation("gatherings");
  const calendar = useHijriCalendar();
  const formatHijriDate = useFormatHijriDate();
  const formatDay = useFormatDay();
  const month = gatheringMonth(gatherings, date.toPlainYearMonth());
  const first = month.month.toPlainDate({ day: 1 });
  const last = month.month.toPlainDate({ day: month.month.daysInMonth });
  const firstHijri = calendar.toHijri(first);
  const lastHijri = calendar.toHijri(last);
  const isThisMonth = month.month.equals(today.toPlainYearMonth());
  const selected = formatDay(date);
  // Changing the month chooses its 1st (or today, in today's month).
  const showMonth = (shown: Temporal.PlainYearMonth) =>
    onDateChange(
      shown.equals(today.toPlainYearMonth())
        ? today
        : shown.toPlainDate({ day: 1 })
    );

  return (
    <>
      <Card>
        <Card.Header>
          <PeriodStepper
            title={formatGregorianDate(first, MONTH_YEAR)}
            subtitle={`${formatHijriDate({ year: firstHijri.year, month: firstHijri.month })} – ${formatHijriDate({ year: lastHijri.year, month: lastHijri.month })}`}
            labels={{
              previous: t("month.previous"),
              next: t("month.next"),
              reset: t("month.thisMonth"),
            }}
            onPrevious={() => showMonth(month.month.subtract({ months: 1 }))}
            onNext={() => showMonth(month.month.add({ months: 1 }))}
            onReset={isThisMonth ? null : () => onDateChange(today)}
          />
        </Card.Header>
        <Card.Content>
          <View className="gap-1">
            <View className="flex-row">
              {WEEKDAYS.map((weekday) => (
                <Text
                  key={weekday}
                  size="xs"
                  muted
                  className="flex-1 text-center"
                >
                  {t(`weekdays.${weekday}`)}
                </Text>
              ))}
            </View>
            {month.weeks.map((week) => (
              <View
                key={week.find(Boolean)?.date.toString()}
                className="flex-row gap-1"
              >
                {week.map((day, index) =>
                  day ? (
                    <DayCell
                      key={day.date.day}
                      day={day}
                      isToday={day.date.equals(today)}
                      isSelected={day.date.equals(date)}
                      onSelect={onDateChange}
                    />
                  ) : (
                    // oxlint-disable-next-line react/no-array-index-key -- empty cells have no identity but their position
                    <View key={`empty-${index}`} className="flex-1" />
                  )
                )}
              </View>
            ))}
          </View>
        </Card.Content>
      </Card>
      <Card>
        <Card.Header>
          <Card.Title>{selected.gregorian}</Card.Title>
          <Card.Description>{selected.hijri}</Card.Description>
        </Card.Header>
        <Card.Content>
          <GatheringList
            gatherings={gatheringsOn(gatherings, date)}
            speakers={speakers}
            empty={t("empty.noneOnDay")}
          />
        </Card.Content>
      </Card>
    </>
  );
};
