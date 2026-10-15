import type { Slide } from "@alrisali/domain/lessons";
import { localized } from "@alrisali/domain/shared";
import { Direction, Text } from "panelui-native";
import { useCallback } from "react";
import type { Ref } from "react";
import { FlatList, Image, View } from "react-native";
import type { ListViewToken } from "react-native";

import { launchDirection } from "@/shared/lib/i18n";
import { launchLanguage } from "@/shared/lib/preferences";

import { slideImageUrl } from "../data/lessons";

const VIEWABILITY = { itemVisiblePercentThreshold: 60 };

interface SlideCarouselProps {
  slides: readonly Slide[];
  /** The Slide to open at; the list keeps its own position afterwards. */
  initialSlide: number;
  width: number;
  imageHeight: number;
  /** Stable: FlatList does not support swapping it. */
  onSlideShown: (slide: number) => void;
  listRef: Ref<FlatList<Slide>>;
}

/**
 * A Lesson's Slides, one per page, swiped in the reading direction: the
 * next Slide lies to the left in Arabic and to the right in English.
 */
export const SlideCarousel = ({
  slides,
  initialSlide,
  width,
  imageHeight,
  onSlideShown,
  listRef,
}: SlideCarouselProps) => {
  const onViewableItemsChanged = useCallback(
    ({ viewableItems }: { viewableItems: ListViewToken[] }) => {
      const [first] = viewableItems;
      if (typeof first?.index === "number") {
        onSlideShown(first.index);
      }
    },
    [onSlideShown]
  );

  return (
    <Direction dir={launchDirection}>
      <FlatList
        ref={listRef}
        data={slides}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        initialScrollIndex={initialSlide}
        getItemLayout={(_, index) => ({
          length: width,
          offset: width * index,
          index,
        })}
        initialNumToRender={1}
        windowSize={3}
        keyExtractor={(slide) => slide.id}
        viewabilityConfig={VIEWABILITY}
        onViewableItemsChanged={onViewableItemsChanged}
        renderItem={({ item, index }) => {
          const caption = localized(item.caption, launchLanguage);
          return (
            <View
              style={{ width }}
              className="gap-3"
              testID={`lesson-slide-${index}`}
            >
              <Image
                source={{ uri: slideImageUrl(item) }}
                accessibilityIgnoresInvertColors
                accessibilityLabel={caption || undefined}
                resizeMode="contain"
                style={{ width, height: imageHeight }}
                className="bg-muted rounded-xl"
              />
              {caption ? <Text size="lg">{caption}</Text> : null}
            </View>
          );
        }}
      />
    </Direction>
  );
};
