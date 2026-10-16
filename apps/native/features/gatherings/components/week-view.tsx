import { gatheringWeek } from "@alrisali/domain/gatherings";
import type { Gathering, Speaker } from "@alrisali/domain/gatherings";
import { Card, Text } from "panelui-native";
import { useTranslation } from "react-i18next";
import { View } from "react-native";
import type { Temporal } from "temporal-polyfill";

import {
  formatGregorianDate,
  useFormatHijriDate,
  useHijriCalendar,
} from "@/shared/lib/hijri-calendar";

import { useFormatDay } from "../hooks/use-format-day";
import { EmptyNotice } from "./empty-notice";
import { GatheringList } from "./gathering-list";
import { PeriodStepper } from "./period-stepper";

const DAYS_PER_WEEK = 7;
const DAY_MONTH: Intl.DateTimeFormatOptions = {
  day: "numeric",
  month: "short",
};
const DAY_MONTH_YEAR: Intl.DateTimeFormatOptions = {
  ...DAY_MONTH,
  year: "numeric",
};

/** The week (Saturday to Friday) holding `date`, day by day. */
export const WeekView = ({
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
  const formatDay = useFormatDay();
  const calendar = useHijriCalendar();
  const formatHijriDate = useFormatHijriDate();
  const week = gatheringWeek(gatherings, date);
  const first = week[0]?.date ?? date;
  const last = week.at(-1)?.date ?? date;
  const holdsToday = week.some((day) => day.date.equals(today));
  const isEmpty = week.every((day) => day.gatherings.length === 0);
  const firstHijri = calendar.toHijri(first);
  const lastHijri = calendar.toHijri(last);

  return (
    <>
      <Card>
        <Card.Header>
          <PeriodStepper
            title={`${formatGregorianDate(first, DAY_MONTH)} – ${formatGregorianDate(last, DAY_MONTH_YEAR)}`}
            subtitle={`${formatHijriDate(firstHijri)} – ${formatHijriDate(lastHijri)}`}
            labels={{
              previous: t("week.previous"),
              next: t("week.next"),
              reset: t("week.thisWeek"),
            }}
            onPrevious={() =>
              onDateChange(date.subtract({ days: DAYS_PER_WEEK }))
            }
            onNext={() => onDateChange(date.add({ days: DAYS_PER_WEEK }))}
            onReset={holdsToday ? null : () => onDateChange(today)}
          />
        </Card.Header>
      </Card>
      {isEmpty ? <EmptyNotice title={t("empty.noneInWeek")} /> : null}
      {isEmpty
        ? null
        : week.map((day) => {
            const label = formatDay(day.date);
            return (
              <Card key={day.date.toString()}>
                <Card.Header>
                  <View className="flex-row items-baseline justify-between gap-2">
                    <Card.Title>{label.gregorian}</Card.Title>
                    {day.date.equals(today) ? (
                      <Text
                        size="sm"
                        weight="semibold"
                        className="text-primary"
                      >
                        {t("day.today")}
                      </Text>
                    ) : null}
                  </View>
                  <Card.Description>{label.hijri}</Card.Description>
                </Card.Header>
                <Card.Content>
                  <GatheringList
                    gatherings={day.gatherings}
                    speakers={speakers}
                    empty={t("empty.noneOnDay")}
                  />
                </Card.Content>
              </Card>
            );
          })}
    </>
  );
};
