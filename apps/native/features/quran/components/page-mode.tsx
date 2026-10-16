import { findAyah, PAGE_COUNT } from "@alrisali/domain/quran";
import type { PageNav } from "@alrisali/domain/quran";
import { Direction } from "panelui-native";
import { useCallback } from "react";
import { FlatList } from "react-native";
import type { ListViewToken } from "react-native";

import { QuranPageView } from "./quran-page-view";
import type { AyahGestures } from "./quran-page-view";

const PAGES = Array.from({ length: PAGE_COUNT }, (_, index) => index + 1);
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
 * the left, as in a mushaf); vertical is a virtualised scroll of pages.
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
}: PageModeProps) => {
  const horizontal = pageNav === "horizontal";
  const length = horizontal ? width : height;
  const lastReadPage = lastReadAyah ? findAyah(lastReadAyah)?.page : undefined;

  // FlatList does not support swapping this callback, so the screen passes a
  // stable `onPageShown`.
  const onViewableItemsChanged = useCallback(
    ({ viewableItems }: { viewableItems: ListViewToken[] }) => {
      const [first] = viewableItems;
      if (typeof first?.item === "number") {
        onPageShown(first.item);
      }
    },
    [onPageShown]
  );

  return (
    <Direction dir="rtl" className="flex-1">
      <FlatList
        // A new axis needs a fresh list at the current page.
        key={pageNav}
        data={PAGES}
        horizontal={horizontal}
        pagingEnabled={horizontal}
        showsHorizontalScrollIndicator={false}
        showsVerticalScrollIndicator={false}
        initialScrollIndex={initialPage - 1}
        getItemLayout={(_, index) => ({
          length,
          offset: length * index,
          index,
        })}
        initialNumToRender={1}
        maxToRenderPerBatch={2}
        windowSize={horizontal ? 3 : 5}
        keyExtractor={String}
        extraData={`${selectedAyah}|${pressingAyah}|${lastReadAyah}`}
        viewabilityConfig={VIEWABILITY}
        onViewableItemsChanged={onViewableItemsChanged}
        onScrollBeginDrag={onScrollStart}
        renderItem={({ item }) => (
          <QuranPageView
            page={item}
            width={width}
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
            lastReadAyah={item === lastReadPage ? lastReadAyah : null}
          />
        )}
      />
    </Direction>
  );
};
