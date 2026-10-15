import "../i18n";
import { visibleLessons } from "@alrisali/domain/lessons";
import { router } from "expo-router";
import { Button, Card, Text } from "panelui-native";
import { useTranslation } from "react-i18next";

import { useLessonProgress } from "../data/lesson-progress";
import { useLessons } from "../data/lessons";

/** The Library tab's way into Lessons, with how many the Believer completed. */
export const LessonsLinkCard = () => {
  const { t } = useTranslation("lessons");
  const { data: lessons = [] } = useLessons();
  const { data: progress = {} } = useLessonProgress();
  const shown = visibleLessons(lessons);
  const completed = shown.filter(
    (lesson) => (progress[lesson.id]?.completedAt ?? null) !== null
  ).length;

  return (
    <Card>
      <Card.Header>
        <Card.Title>{t("link.title")}</Card.Title>
        <Card.Description>{t("link.description")}</Card.Description>
      </Card.Header>
      <Card.Content className="items-start gap-3">
        {shown.length > 0 ? (
          <Text muted size="sm">
            {t("link.completed", { completed, total: shown.length })}
          </Text>
        ) : null}
        <Button
          variant="outline"
          onPress={() => router.push("/library/lessons")}
          testID="lessons-open"
        >
          {t("link.open")}
        </Button>
      </Card.Content>
    </Card>
  );
};
