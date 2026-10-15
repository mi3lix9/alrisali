import { habitStreak } from "@alrisali/domain/habits";
import { isHabitDueOn } from "@alrisali/domain/shared";
import { Button, Card, Checkbox, Text } from "panelui-native";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { View } from "react-native";
import { Temporal } from "temporal-polyfill";

import { launchLanguage } from "@/shared/lib/preferences";
import { useToday } from "@/shared/lib/today";

import type { HabitData } from "../data/habits";
import { useSetHabitCompleted } from "../data/habits";
import { habitName } from "../utils/habit-name";

const DATE_FORMAT: Intl.DateTimeFormatOptions = {
  weekday: "long",
  day: "numeric",
  month: "long",
  year: "numeric",
};

/**
 * The Habits due on one date, each with a tick and its streak. Today or any
 * past date can be shown; a future one cannot.
 */
export const HabitDayCard = ({ data }: { data: HabitData }) => {
  const { t } = useTranslation("habits");
  const today = useToday();
  // null follows today, so the card moves on at midnight.
  const [picked, setPicked] = useState<Temporal.PlainDate | null>(null);
  const date =
    picked && Temporal.PlainDate.compare(picked, today) <= 0 ? picked : today;
  const isToday = date.equals(today);
  const { mutate: setCompleted, isError } = useSetHabitCompleted();

  const showDate = (next: Temporal.PlainDate) =>
    setPicked(next.equals(today) ? null : next);

  const due = data.habits.filter(
    (habit) => !habit.archived && isHabitDueOn(habit.schedule, date)
  );

  return (
    <Card>
      <Card.Header>
        <Card.Title>{t("title")}</Card.Title>
        <Card.Description>{t("description")}</Card.Description>
      </Card.Header>
      <Card.Content className="gap-4">
        <View className="flex-row items-center justify-between gap-2">
          <Button
            variant="outline"
            size="sm"
            onPress={() => showDate(date.subtract({ days: 1 }))}
          >
            {t("previousDay")}
          </Button>
          <Text weight="medium" className="flex-1 text-center">
            {isToday
              ? t("today")
              : date.toLocaleString(launchLanguage, DATE_FORMAT)}
          </Text>
          <Button
            variant="outline"
            size="sm"
            disabled={isToday}
            onPress={() => showDate(date.add({ days: 1 }))}
          >
            {t("nextDay")}
          </Button>
        </View>
        {due.length === 0 ? <Text muted>{t("noneDue")}</Text> : null}
        {due.map((habit) => {
          const dates = data.completions
            .filter(({ habitId }) => habitId === habit.id)
            .map((completion) => completion.date);
          const streak = t("streak.times", {
            count: habitStreak(habit.schedule, dates, today).current,
          });
          return (
            <View
              key={habit.id}
              className="flex-row items-center justify-between gap-2"
            >
              <View className="flex-1">
                <Checkbox
                  checked={dates.some((done) => done.equals(date))}
                  onCheckedChange={(completed) =>
                    setCompleted({ habitId: habit.id, date, completed })
                  }
                  label={habitName(habit, t)}
                />
              </View>
              <Text
                muted
                accessibilityLabel={`${t("streak.label")}: ${streak}`}
              >
                {streak}
              </Text>
            </View>
          );
        })}
        {isError ? (
          <Text className="text-destructive">{t("saveError")}</Text>
        ) : null}
      </Card.Content>
      {isToday ? null : (
        <Card.Footer>
          <Button variant="secondary" onPress={() => setPicked(null)}>
            {t("today")}
          </Button>
        </Card.Footer>
      )}
    </Card>
  );
};
