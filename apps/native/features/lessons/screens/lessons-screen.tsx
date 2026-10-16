import "../i18n";
import type { LessonCategory } from "@alrisali/domain/lessons";
import { Stack } from "expo-router";
import { Spinner, Text } from "panelui-native";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { View } from "react-native";

import { Screen } from "@/shared/ui/screen";

import { CategoryFilter } from "../components/category-filter";
import { LessonCard } from "../components/lesson-card";
import { useLessonProgress } from "../data/lesson-progress";
import { useLessons } from "../data/lessons";
import { lessonRows } from "../utils/lesson-rows";

/** Published Lessons, by category, each with the Believer's progress. */
export const LessonsScreen = () => {
  const { t } = useTranslation("lessons");
  const [category, setCategory] = useState<LessonCategory | null>(null);
  const lessons = useLessons();
  const { data: progress = {} } = useLessonProgress();

  const title = <Stack.Screen options={{ title: t("title") }} />;

  if (lessons.isPending) {
    return (
      <View className="bg-background flex-1 items-center justify-center">
        {title}
        <Spinner />
      </View>
    );
  }

  const rows = lessonRows(lessons.data ?? [], progress, category);

  return (
    <Screen>
      {title}
      <CategoryFilter selected={category} onSelect={setCategory} />
      {lessons.isError ? (
        <Text className="text-destructive">{t("loadError")}</Text>
      ) : null}
      {rows.length === 0 ? (
        <Text muted>{t("empty")}</Text>
      ) : (
        rows.map((row) => <LessonCard key={row.lesson.id} row={row} />)
      )}
    </Screen>
  );
};
