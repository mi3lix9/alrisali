import "../i18n";
import { HIJRI_MONTHS } from "@alrisali/domain/shared";
import type { HijriMonth } from "@alrisali/domain/shared";
import {
  Chip,
  DatePicker,
  Text,
  ToggleButton,
  ToggleButtonGroup,
} from "panelui-native";
import { useTranslation } from "react-i18next";
import { ScrollView, View } from "react-native";
import { Temporal } from "temporal-polyfill";

import { useHijriMonthName } from "@/shared/lib/hijri-calendar";
import { launchLanguage } from "@/shared/lib/preferences";

import { StepperField } from "./stepper-field";

export type DeadlineCalendar = "gregorian" | "hijri";

const MAX_HIJRI_DAY = 30;

const toDate = (date: Temporal.PlainDate): Date =>
  new Date(date.year, date.month - 1, date.day);

const fromDate = (date: Date): Temporal.PlainDate =>
  Temporal.PlainDate.from({
    year: date.getFullYear(),
    month: date.getMonth() + 1,
    day: date.getDate(),
  });

/**
 * The by-deadline plan's day: a Gregorian date, or a Hijri month and day
 * (such as 29 Ramadan) that falls on its next occurrence.
 */
export const DeadlineField = ({
  calendar,
  onCalendarChange,
  date,
  onDateChange,
  minDate,
  month,
  day,
  onHijriChange,
}: {
  calendar: DeadlineCalendar;
  onCalendarChange: (calendar: DeadlineCalendar) => void;
  date: Temporal.PlainDate;
  onDateChange: (date: Temporal.PlainDate) => void;
  minDate: Temporal.PlainDate;
  month: HijriMonth;
  day: number;
  onHijriChange: (next: { month: HijriMonth; day: number }) => void;
}) => {
  const { t } = useTranslation("khatmah");
  const monthName = useHijriMonthName();
  return (
    <View className="gap-3">
      <Text weight="medium">{t("plan.deadline.calendar")}</Text>
      <ToggleButtonGroup
        testID="khatmah-deadline-calendar"
        selectionMode="single"
        size="sm"
        accessibilityLabel={t("plan.deadline.calendar")}
        value={[calendar]}
        onValueChange={([next]) => {
          if (next === "gregorian" || next === "hijri") {
            onCalendarChange(next);
          }
        }}
      >
        <ToggleButton id="gregorian">
          {t("plan.deadline.gregorian")}
        </ToggleButton>
        <ToggleButton id="hijri">{t("plan.deadline.hijri")}</ToggleButton>
      </ToggleButtonGroup>
      {calendar === "gregorian" ? (
        <View className="gap-2">
          <Text weight="medium">{t("plan.deadline.date")}</Text>
          <DatePicker
            selected={toDate(date)}
            onSelect={(selected) => {
              if (selected) {
                onDateChange(fromDate(selected));
              }
            }}
            minDate={toDate(minDate)}
            locale={launchLanguage}
          />
        </View>
      ) : (
        <View className="gap-3">
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            accessibilityLabel={t("plan.deadline.month")}
            contentContainerClassName="gap-2"
            className="grow-0"
          >
            {HIJRI_MONTHS.map((option) => (
              <Chip
                key={option}
                size="lg"
                testID={`khatmah-deadline-month-${option}`}
                variant={option === month ? "primary" : "outline"}
                selected={option === month}
                onPress={() => onHijriChange({ month: option, day })}
              >
                {monthName(option)}
              </Chip>
            ))}
          </ScrollView>
          <StepperField
            testID="khatmah-deadline-day"
            label={t("plan.deadline.day")}
            value={day}
            min={1}
            max={MAX_HIJRI_DAY}
            onChange={(next) => onHijriChange({ month, day: next })}
            decreaseLabel={t("plan.deadline.decrease")}
            increaseLabel={t("plan.deadline.increase")}
          />
        </View>
      )}
    </View>
  );
};
