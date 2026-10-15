import "../i18n";
import { localized } from "@alrisali/domain/shared";
import { router } from "expo-router";
import { Badge, Card, Progress, Text } from "panelui-native";
import { useTranslation } from "react-i18next";
import { Image, Pressable, View } from "react-native";

import { launchLanguage } from "@/shared/lib/preferences";

import { slideImageUrl } from "../data/lessons";
import type { LessonRow } from "../utils/lesson-rows";

/** A Lesson in the list: its first Slide, category and true progress. */
export const LessonCard = ({
  row: { lesson, summary },
}: {
  row: LessonRow;
}) => {
  const { t } = useTranslation("lessons");
  const [cover] = lesson.slides;
  const title = localized(lesson.title, launchLanguage);
  const description = localized(lesson.description, launchLanguage);

  return (
    <Card testID={`lessons-card-${lesson.id}`}>
      <Pressable
        accessibilityRole="link"
        accessibilityLabel={title}
        onPress={() =>
          router.push({
            pathname: "/library/lessons/[id]",
            params: { id: lesson.id },
          })
        }
      >
        {cover ? (
          <Image
            source={{ uri: slideImageUrl(cover) }}
            accessibilityIgnoresInvertColors
            className="bg-muted aspect-video w-full rounded-t-xl"
            resizeMode="cover"
          />
        ) : null}
        <Card.Header>
          <Card.Title>{title}</Card.Title>
          {description ? (
            <Card.Description numberOfLines={2}>{description}</Card.Description>
          ) : null}
        </Card.Header>
        <Card.Content className="gap-2">
          <View className="flex-row flex-wrap items-center gap-2">
            <Badge size="sm" variant="secondary">
              {t(`categories.${lesson.category}`)}
            </Badge>
            {summary.status === "in-progress" ? null : (
              <Badge
                size="sm"
                variant={summary.status === "completed" ? "success" : "outline"}
              >
                {t(`status.${summary.status}`)}
              </Badge>
            )}
            <Text muted size="sm">
              {t("slides", { count: summary.total })}
            </Text>
          </View>
          {summary.status === "in-progress" ? (
            <View className="gap-1">
              <Progress value={summary.seen} maxValue={summary.total} />
              <Text muted size="sm">
                {t("seen", { seen: summary.seen, total: summary.total })}
              </Text>
            </View>
          ) : null}
        </Card.Content>
      </Pressable>
    </Card>
  );
};
