import {
  findAyah,
  PAGE_COUNT,
  pagesOfSpread,
  shownPageOfSpread,
  showsSpread,
  SPREAD_COUNT,
  spreadOfPage,
} from "@alrisali/domain/quran";
import type { PageNav } from "@alrisali/domain/quran";
import { Direction } from "panelui-native";
import { useCallback, useState } from "react";
import { FlatList, View } from "react-native";
import type { ListViewToken } from "react-native";

import { QuranPageView } from "./quran-page-view";
import type { AyahGestures } from "./quran-page-view";

const PAGES = Array.from({ length: PAGE_COUNT }, (_, index) => index + 1);
const SPREADS = Array.from({ length: SPREAD_COUNT }, (_, index) => index + 1);
const VIEWABILITY = { itemVisiblePercentThreshold: 60 };

interface PageModeProps extends AyahGestures {
  pageNav: PageNav;
  /** The page to open at; the list keeps its own position afterwards. */
  initialPage: number;
  width: number;
  height: number;
  insetTop: number;
  insetBottom: number;
  onPageShown: (page: number) => void;
  /** The Believer started a swipe or scroll. */
  onScrollStart: () => void;
}

/**
 * Page Mode: the 604 Quran Pages, one per screen. Horizontal is a pager
 * that reads right to left whatever the app language (the next page lies to
 * the left, as in a mushaf); vertical is a virtualised scroll of pages. On a
 * wide landscape screen each item is a spread of two pages, the odd page on
 * the right; the right page counts as the page shown.
 */
export const PageMode = ({
  pageNav,
  initialPage,
  width,
  height,
  insetTop,
  insetBottom,
  onPageShown,
  onScrollStart,
  onTap,
  onLongPressAyah,
  onPressInAyah,
  onPressOut,
  selectedAyah,
  pressingAyah,
  lastReadAyah,
  decorations,
}: PageModeProps) => {
  const horizontal = pageNav === "horizontal";
  const spread = showsSpread({ width, height });
  const length = horizontal ? width : height;
  const pageWidth = spread ? width / 2 : width;
  // A turn of the device remounts the list; it reopens at the page last shown.
  const [shown, setShown] = useState(initialPage);
  const lastReadPage = lastReadAyah ? findAyah(lastReadAyah)?.page : undefined;

  // FlatList does not support swapping this callback, so the screen passes a
  // stable `onPageShown`.
  const onViewableItemsChanged = useCallback(
    ({ viewableItems }: { viewableItems: ListViewToken[] }) => {
      const [first] = viewableItems;
      if (typeof first?.item === "number") {
        const page = spread ? shownPageOfSpread(first.item) : first.item;
        setShown(page);
        onPageShown(page);
      }
    },
    [onPageShown, spread]
  );

  return (
    <Direction dir="rtl" className="flex-1">
      <FlatList
        // A new axis needs a fresh list at the current page.
        key={`${pageNav}-${spread}`}
        data={spread ? SPREADS : PAGES}
        horizontal={horizontal}
        pagingEnabled={horizontal}
        showsHorizontalScrollIndicator={false}
        showsVerticalScrollIndicator={false}
        initialScrollIndex={(spread ? spreadOfPage(shown) : shown) - 1}
        getItemLayout={(_, index) => ({
          length,
          offset: length * index,
          index,
        })}
        initialNumToRender={1}
        maxToRenderPerBatch={2}
        windowSize={horizontal ? 3 : 5}
        keyExtractor={String}
        extraData={[selectedAyah, pressingAyah, lastReadAyah, decorations]}
        viewabilityConfig={VIEWABILITY}
        onViewableItemsChanged={onViewableItemsChanged}
        onScrollBeginDrag={onScrollStart}
        renderItem={({ item }) => {
          const pages = spread ? pagesOfSpread(item) : [item];
          const views = pages.map((page) => (
            <QuranPageView
              key={page}
              page={page}
              width={pageWidth}
              height={height}
              insetTop={insetTop}
              insetBottom={insetBottom}
              onTap={onTap}
              onLongPressAyah={onLongPressAyah}
              onPressInAyah={onPressInAyah}
              onPressOut={onPressOut}
              selectedAyah={selectedAyah}
              pressingAyah={pressingAyah}
              // Only its own page redraws when the Last-Read Ayah moves.
              lastReadAyah={page === lastReadPage ? lastReadAyah : null}
              decorations={decorations}
            />
          ));
          return spread ? (
            <View style={{ flexDirection: "row", width, height }}>{views}</View>
          ) : (
            views[0]
          );
        }}
      />
    </Direction>
  );
};
