import type { Habit } from "@alrisali/domain/habits";
import { Button, Card, Item, Text } from "panelui-native";
import { useTranslation } from "react-i18next";
import { Alert } from "react-native";

import { launchLanguage } from "@/shared/lib/preferences";

import { useRemoveHabit, useSetHabitArchived } from "../data/habits";
import { habitName } from "../utils/habit-name";

const minuteOfDayLabel = (minuteOfDay: number): string =>
  new Intl.DateTimeFormat(launchLanguage, {
    hour: "numeric",
    minute: "2-digit",
    timeZone: "UTC",
  }).format(minuteOfDay * 60_000);

const ScheduleLine = ({ habit }: { habit: Habit }) => {
  const { t } = useTranslation("habits");
  const { schedule } = habit;
  let repeat: string;
  if (schedule.kind === "weekdays") {
    repeat = schedule.weekdays
      .map((weekday) => t(`weekday.${weekday}`))
      .join(launchLanguage === "ar" ? "، " : ", ");
  } else if (schedule.kind === "once") {
    repeat = t("schedule.onDate", {
      date: schedule.date.toLocaleString(launchLanguage, {
        day: "numeric",
        month: "long",
        year: "numeric",
      }),
    });
  } else {
    repeat = t("schedule.daily");
  }
  const parts = [
    repeat,
    habit.reminderAt === null
      ? null
      : t("schedule.reminderAt", { time: minuteOfDayLabel(habit.reminderAt) }),
    habit.archived ? t("manage.archived") : null,
  ];
  return (
    <Item.Description>{parts.filter(Boolean).join(" · ")}</Item.Description>
  );
};

/** Every Habit, with archive, restore and delete. */
export const HabitListCard = ({ habits }: { habits: readonly Habit[] }) => {
  const { t } = useTranslation("habits");
  const { mutate: setArchived } = useSetHabitArchived();
  const { mutate: remove, isError: removeFailed } = useRemoveHabit();

  const confirmDelete = (habit: Habit) => {
    const name = habitName(habit, t);
    Alert.alert(t("manage.deleteTitle", { name }), t("manage.deleteMessage"), [
      { text: t("manage.cancel"), style: "cancel" },
      {
        text: t("manage.confirmDelete"),
        style: "destructive",
        onPress: () => remove(habit.id),
      },
    ]);
  };

  return (
    <Card>
      <Card.Header>
        <Card.Title>{t("manage.title")}</Card.Title>
        <Card.Description>{t("manage.description")}</Card.Description>
      </Card.Header>
      <Card.Content className="gap-2">
        {habits.map((habit) => (
          <Item key={habit.id} size="sm">
            <Item.Content>
              <Item.Title>{habitName(habit, t)}</Item.Title>
              <ScheduleLine habit={habit} />
            </Item.Content>
            <Item.Actions>
              <Button
                variant="outline"
                size="sm"
                onPress={() =>
                  setArchived({ id: habit.id, archived: !habit.archived })
                }
              >
                {habit.archived ? t("manage.restore") : t("manage.archive")}
              </Button>
              <Button
                variant="destructive"
                size="sm"
                onPress={() => confirmDelete(habit)}
              >
                {t("manage.delete")}
              </Button>
            </Item.Actions>
          </Item>
        ))}
        {removeFailed ? (
          <Text className="text-destructive">{t("saveError")}</Text>
        ) : null}
      </Card.Content>
    </Card>
  );
};
