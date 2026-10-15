import { resumePosition } from "@alrisali/domain/library-assets";
import type {
  LibraryAsset,
  StructuredTextBlock,
} from "@alrisali/domain/library-assets";
import { Button, Direction, Spinner, Text } from "panelui-native";
import { MinusIcon, PlusIcon } from "panelui-native/icons";
import { useCallback, useEffect, useRef, useState } from "react";
import type { ReactElement } from "react";
import { useTranslation } from "react-i18next";
import { FlatList, View } from "react-native";

import { useStructuredText } from "../data/library-assets";
import { usePositionSaver } from "../hooks/use-position-saver";

const FONT_SIZE = { min: 14, max: 34, step: 2, initial: 20 } as const;
const LINE_HEIGHT = 1.8;
// English runs smaller than Arabic at the same point size reads.
const ENGLISH_SCALE = 0.75;
/** A block counts as reached once half of it is on screen. */
const VIEWABILITY = { itemVisiblePercentThreshold: 50 };

const BlockView = ({
  block,
  fontSize,
}: {
  block: StructuredTextBlock;
  fontSize: number;
}) => {
  const englishSize = Math.round(fontSize * ENGLISH_SCALE);
  const isTitle = block.type === "title";
  return (
    <View
      className={
        isTitle ? "gap-1 pt-6 pb-2" : "border-border gap-2 border-b py-4"
      }
    >
      <Direction dir="rtl">
        <Text
          selectable
          className={isTitle ? "font-bold" : ""}
          style={{ fontSize, lineHeight: fontSize * LINE_HEIGHT }}
        >
          {block.text.ar}
        </Text>
      </Direction>
      {block.text.en ? (
        <Direction dir="ltr">
          <Text
            selectable
            muted
            style={{
              fontSize: englishSize,
              lineHeight: englishSize * LINE_HEIGHT,
            }}
          >
            {block.text.en}
          </Text>
        </Direction>
      ) : null}
    </View>
  );
};

/**
 * A structured-text Library Asset, reopened at the block the Believer had
 * reached, with Arabic and its English under it.
 */
export const TextReader = ({
  asset,
  saved,
  header,
}: {
  asset: LibraryAsset;
  saved: number | null;
  header: ReactElement;
}) => {
  const { t } = useTranslation("library-assets");
  const blocks = useStructuredText(asset.fileKey);
  const report = usePositionSaver(asset.id);
  const listRef = useRef<FlatList<StructuredTextBlock>>(null);
  const resumedRef = useRef(false);
  const reportRef = useRef(report);
  const [fontSize, setFontSize] = useState<number>(FONT_SIZE.initial);

  useEffect(() => {
    reportRef.current = report;
  }, [report]);

  // FlatList wants the same callback for its whole life.
  const onViewableItemsChanged = useCallback(
    ({
      viewableItems,
    }: {
      viewableItems: { item: StructuredTextBlock; isViewable: boolean }[];
    }) => {
      const first = viewableItems.find((token) => token.isViewable)?.item;
      if (resumedRef.current && first) {
        reportRef.current(first.index);
      }
    },
    []
  );

  const resume = useCallback(() => {
    if (resumedRef.current || !blocks.data) {
      return;
    }
    const index = resumePosition("text", saved, blocks.data.length);
    if (index > 0) {
      listRef.current?.scrollToIndex({ index, animated: false });
    }
    resumedRef.current = true;
  }, [blocks.data, saved]);

  const controls = (
    <View className="gap-4 pb-2">
      {header}
      <View className="flex-row justify-end gap-2">
        <Button
          variant="outline"
          size="icon"
          accessibilityLabel={t("text.smaller")}
          disabled={fontSize <= FONT_SIZE.min}
          onPress={() => setFontSize((size) => size - FONT_SIZE.step)}
        >
          <MinusIcon size={18} />
        </Button>
        <Button
          variant="outline"
          size="icon"
          accessibilityLabel={t("text.larger")}
          disabled={fontSize >= FONT_SIZE.max}
          onPress={() => setFontSize((size) => size + FONT_SIZE.step)}
        >
          <PlusIcon size={18} />
        </Button>
      </View>
    </View>
  );

  return (
    <FlatList
      ref={listRef}
      className="bg-background flex-1"
      contentContainerClassName="p-4"
      contentInsetAdjustmentBehavior="automatic"
      data={blocks.data ?? []}
      keyExtractor={(block) => String(block.index)}
      extraData={fontSize}
      ListHeaderComponent={controls}
      ListEmptyComponent={
        blocks.isError ? (
          <View className="items-center gap-3 py-6">
            <Text muted className="text-center">
              {t("loadError")}
            </Text>
            <Button
              variant="outline"
              onPress={async () => {
                await blocks.refetch();
              }}
            >
              {t("retry")}
            </Button>
          </View>
        ) : (
          <Spinner label={t("loading")} />
        )
      }
      viewabilityConfig={VIEWABILITY}
      onViewableItemsChanged={onViewableItemsChanged}
      onContentSizeChange={resume}
      onScrollToIndexFailed={({ index, averageItemLength }) => {
        // Blocks not laid out yet: jump near, then to the block itself.
        listRef.current?.scrollToOffset({
          offset: averageItemLength * index,
          animated: false,
        });
        setTimeout(() => {
          listRef.current?.scrollToIndex({ index, animated: false });
        }, 100);
      }}
      renderItem={({ item }) => <BlockView block={item} fontSize={fontSize} />}
    />
  );
};
