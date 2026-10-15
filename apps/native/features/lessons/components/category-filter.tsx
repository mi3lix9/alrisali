import "../i18n";
import { LESSON_CATEGORIES } from "@alrisali/domain/lessons";
import type { LessonCategory } from "@alrisali/domain/lessons";
import { Chip } from "panelui-native";
import { useTranslation } from "react-i18next";
import { ScrollView } from "react-native";

/** 'All' and each Lesson category as a row of chips; one is chosen at a time. */
export const CategoryFilter = ({
  selected,
  onSelect,
}: {
  selected: LessonCategory | null;
  onSelect: (category: LessonCategory | null) => void;
}) => {
  const { t } = useTranslation("lessons");

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      accessibilityLabel={t("categories.label")}
      contentContainerClassName="gap-2"
      className="grow-0"
    >
      {[null, ...LESSON_CATEGORIES].map((category) => (
        <Chip
          key={category ?? "all"}
          size="lg"
          variant={selected === category ? "primary" : "outline"}
          selected={selected === category}
          testID={`lessons-category-${category ?? "all"}`}
          onPress={() => onSelect(category)}
        >
          {t(`categories.${category ?? "all"}`)}
        </Chip>
      ))}
    </ScrollView>
  );
};
