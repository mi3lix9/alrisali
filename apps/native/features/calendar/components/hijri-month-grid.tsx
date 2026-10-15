import { occasionsOn, OCCASION_TYPES } from "@alrisali/domain/shared";
import type {
  HijriGridDay,
  HijriMonthGrid,
  Occasion,
} from "@alrisali/domain/shared";
import { Text } from "panelui-native";
import { useTranslation } from "react-i18next";
import { Pressable, View } from "react-native";
import type { Temporal } from "temporal-polyfill";

import {
  formatGregorianDate,
  useFormatHijriDate,
} from "@/shared/lib/hijri-calendar";

import { OCCASION_STYLE } from "../utils/occasion-style";

/**
 * Column headings for a grid whose weeks start on Saturday (the domain's
 * default), as Hijri wall calendars in the region do.
 */
const WEEKDAYS = ["sat", "sun", "mon", "tue", "wed", "thu", "fri"] as const;

const DayCell = ({
  cell,
  grid,
  occasions,
  isToday,
  isSelected,
  onSelect,
}: {
  cell: HijriGridDay;
  grid: HijriMonthGrid;
  occasions: readonly Occasion[];
  isToday: boolean;
  isSelected: boolean;
  onSelect: (date: Temporal.PlainDate) => void;
}) => {
  const formatHijriDate = useFormatHijriDate();
  const onDay = occasionsOn(cell.hijri, grid.length, occasions);
  const types = OCCASION_TYPES.filter((type) =>
    onDay.some((occasion) => occasion.type === type)
  );
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
      accessibilityLabel={`${formatHijriDate(cell.hijri)} — ${formatGregorianDate(cell.date)}`}
      className={`flex-1 items-center gap-0.5 rounded-lg py-1.5 ${frame}`}
      onPress={() => onSelect(cell.date)}
    >
      <Text
        weight="semibold"
        className={isSelected ? "text-primary-foreground" : ""}
      >
        {cell.hijri.day}
      </Text>
      <Text
        size="xs"
        muted={!isSelected}
        className={isSelected ? "text-primary-foreground" : ""}
      >
        {cell.date.day}
      </Text>
      <View className="h-1.5 flex-row gap-0.5">
        {types.map((type) => (
          <View
            key={type}
            className={`h-1.5 w-1.5 rounded-full ${OCCASION_STYLE[type].dot}`}
          />
        ))}
      </View>
    </Pressable>
  );
};

/**
 * Our own Hijri month grid (Panel's Islamic calendar lays out Gregorian
 * days): each cell shows the Hijri day, its Gregorian day and a dot per
 * Occasion type that falls on it.
 */
export const HijriMonthGridView = ({
  grid,
  occasions,
  today,
  selected,
  onSelect,
}: {
  grid: HijriMonthGrid;
  occasions: readonly Occasion[];
  today: Temporal.PlainDate;
  selected: Temporal.PlainDate;
  onSelect: (date: Temporal.PlainDate) => void;
}) => {
  const { t } = useTranslation("calendar");

  return (
    <View className="gap-1">
      <View className="flex-row">
        {WEEKDAYS.map((weekday) => (
          <Text key={weekday} size="xs" muted className="flex-1 text-center">
            {t(`weekdays.${weekday}`)}
          </Text>
        ))}
      </View>
      {grid.weeks.map((week) => (
        <View key={week.find(Boolean)?.hijri.day} className="flex-row gap-1">
          {week.map((cell, index) =>
            cell ? (
              <DayCell
                key={cell.hijri.day}
                cell={cell}
                grid={grid}
                occasions={occasions}
                isToday={cell.date.equals(today)}
                isSelected={cell.date.equals(selected)}
                onSelect={onSelect}
              />
            ) : (
              // oxlint-disable-next-line react/no-array-index-key -- empty cells have no identity but their position
              <View key={`empty-${index}`} className="flex-1" />
            )
          )}
        </View>
      ))}
    </View>
  );
};
