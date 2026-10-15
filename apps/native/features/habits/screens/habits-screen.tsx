import "../i18n";
import { router } from "expo-router";
import { Button, Spinner } from "panelui-native";
import { useTranslation } from "react-i18next";
import { View } from "react-native";

import { Screen } from "@/shared/ui/screen";

import { HabitDayCard } from "../components/habit-day-card";
import { HabitListCard } from "../components/habit-list-card";
import { useHabitData } from "../data/habits";

/** The Worship tab's Habits: tick today's (or a past day's), manage them all. */
export const HabitsScreen = () => {
  const { t } = useTranslation("habits");
  const { data } = useHabitData();

  if (!data) {
    return (
      <View className="bg-background flex-1 items-center justify-center">
        <Spinner />
      </View>
    );
  }

  return (
    <Screen>
      <HabitDayCard data={data} />
      <Button onPress={() => router.push("/worship/new-habit")}>
        {t("form.newHabit")}
      </Button>
      <HabitListCard habits={data.habits} />
    </Screen>
  );
};
