import "../i18n";
import { lessonProgressSummary } from "@alrisali/domain/lessons";
import type { Lesson, LessonProgress, Slide } from "@alrisali/domain/lessons";
import { localized } from "@alrisali/domain/shared";
import { Stack, useLocalSearchParams } from "expo-router";
import { Badge, Button, Progress, Spinner, Text } from "panelui-native";
import {
  useCallback,
  useEffect,
  useEffectEvent,
  useRef,
  useState,
} from "react";
import { useTranslation } from "react-i18next";
import { useWindowDimensions, View } from "react-native";
import type { FlatList } from "react-native";

import { launchLanguage } from "@/shared/lib/preferences";
import { Screen } from "@/shared/ui/screen";

import { SlideCarousel } from "../components/slide-carousel";
import {
  useLessonProgress,
  useMarkLessonComplete,
  useViewSlide,
} from "../data/lesson-progress";
import { useLesson } from "../data/lessons";

// The screen's padding on each side (Screen's `p-4`).
const SCREEN_PADDING = 16;

const LessonViewer = ({
  lesson,
  progress,
}: {
  lesson: Lesson;
  progress: LessonProgress | null;
}) => {
  const { t } = useTranslation("lessons");
  const window = useWindowDimensions();
  const listRef = useRef<FlatList<Slide>>(null);
  const slideCount = lesson.slides.length;
  const summary = lessonProgressSummary(progress, slideCount);
  // The carousel opens where the Believer left off (read on mount only).
  const [shown, setShown] = useState(summary.resumeAt);
  const viewSlide = useViewSlide();
  const markComplete = useMarkLessonComplete();

  const saveView = useEffectEvent((slide: number) => {
    // A pull may have taken Slides away while the Lesson was open.
    if (slide < slideCount) {
      viewSlide.mutate({ lessonId: lesson.id, slide, slideCount });
    }
  });
  useEffect(() => {
    saveView(shown);
  }, [shown]);

  const onSlideShown = useCallback((slide: number) => setShown(slide), []);
  const goTo = (slide: number) =>
    listRef.current?.scrollToIndex({ index: slide, animated: true });

  const width = window.width - SCREEN_PADDING * 2;
  const imageHeight = Math.min(width * 1.25, window.height * 0.5);
  const completed = summary.status === "completed";

  return (
    <Screen>
      <Stack.Screen
        options={{
          title: localized(lesson.title, launchLanguage),
          headerLargeTitle: false,
        }}
      />
      <SlideCarousel
        slides={lesson.slides}
        initialSlide={summary.resumeAt}
        width={width}
        imageHeight={imageHeight}
        onSlideShown={onSlideShown}
        listRef={listRef}
      />

      <View className="gap-2">
        <Text muted size="sm" testID="lesson-slide-position">
          {t("slideOf", { current: shown + 1, total: slideCount })}
        </Text>
        <Progress value={summary.seen} maxValue={slideCount} />
      </View>

      <View className="flex-row gap-3">
        <Button
          variant="outline"
          className="flex-1"
          disabled={shown === 0}
          onPress={() => goTo(shown - 1)}
          testID="lesson-previous"
        >
          {t("previous")}
        </Button>
        <Button
          variant="outline"
          className="flex-1"
          disabled={shown >= slideCount - 1}
          onPress={() => goTo(shown + 1)}
          testID="lesson-next"
        >
          {t("next")}
        </Button>
      </View>

      {completed ? (
        <Badge variant="success" testID="lesson-completed">
          {t("completed")}
        </Badge>
      ) : (
        <Button
          onPress={() => markComplete.mutate(lesson.id)}
          disabled={markComplete.isPending}
          testID="lesson-mark-complete"
        >
          {t("markComplete")}
        </Button>
      )}
      {viewSlide.isError || markComplete.isError ? (
        <Text className="text-destructive">{t("saveError")}</Text>
      ) : null}
    </Screen>
  );
};

/**
 * One Lesson: its Slides in a carousel, reopened where the Believer left
 * off. Every Slide shown is saved; the last one, or Mark complete, completes
 * the Lesson.
 */
export const LessonScreen = () => {
  const { t } = useTranslation("lessons");
  const { id = "" } = useLocalSearchParams<{ id: string }>();
  const lesson = useLesson(id);
  const progress = useLessonProgress();

  if (lesson.isPending || progress.isPending) {
    return (
      <View className="bg-background flex-1 items-center justify-center">
        <Spinner />
      </View>
    );
  }

  if (!lesson.data) {
    return (
      <Screen>
        <Stack.Screen options={{ title: t("title") }} />
        <Text muted>{t("notFound")}</Text>
      </Screen>
    );
  }

  return (
    <LessonViewer
      key={lesson.data.id}
      lesson={lesson.data}
      progress={progress.data?.[lesson.data.id] ?? null}
    />
  );
};
