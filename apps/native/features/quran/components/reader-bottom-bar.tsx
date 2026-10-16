import type { AyahKey } from "@alrisali/content/quran";
import {
  findAyah,
  pagePosition,
  scrubberDomain,
  scrubberTarget,
} from "@alrisali/domain/quran";
import type { JumpTarget, ReaderMode } from "@alrisali/domain/quran";
import { Button, Direction, Slider, Text } from "panelui-native";
import { RotateCcwIcon } from "panelui-native/icons";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { View } from "react-native";
import Animated, { FadeIn, FadeOut } from "react-native-reanimated";

import { formatNumber } from "@/shared/lib/numbers";

import { surahName } from "../utils/format";

/** The bar's height above the bottom safe-area inset. */
export const READER_BOTTOM_BAR_HEIGHT = 64;

interface ReaderBottomBarProps {
  mode: ReaderMode;
  /** The current page (Page Mode) or surah (Surah Mode). */
  value: number;
  returnTo: AyahKey | null;
  insetBottom: number;
  onReturn: () => void;
  onScrubberHold: () => void;
  onScrubberRelease: () => void;
  onJump: (target: JumpTarget) => void;
}

/**
 * The reader's bottom bar, laid over the page while the chrome shows: the
 * return button and the scrubber over pages (Page Mode) or surahs (Surah
 * Mode). The scrubber runs right to left like a mushaf and jumps on release.
 */
export const ReaderBottomBar = ({
  mode,
  value,
  returnTo,
  insetBottom,
  onReturn,
  onScrubberHold,
  onScrubberRelease,
  onJump,
}: ReaderBottomBarProps) => {
  const { t, i18n } = useTranslation("quran");

  // The value under the finger while the scrubber is held.
  const [dragged, setDragged] = useState<number | null>(null);
  const { min, max } = scrubberDomain(mode);
  const returnPage = returnTo ? findAyah(returnTo)?.page : undefined;
  const label = (step: number) =>
    mode === "page"
      ? t("navigation.scrubPageValue", {
          page: formatNumber(step),
          name: surahName(i18n.language, pagePosition(step).surah),
        })
      : t("navigation.scrubSurahValue", {
          number: formatNumber(step),
          name: surahName(i18n.language, step),
        });

  return (
    <Animated.View
      entering={FadeIn.duration(150)}
      exiting={FadeOut.duration(150)}
      style={{ paddingBottom: insetBottom }}
      className="bg-background/95 border-border absolute inset-x-0 bottom-0 border-t dark:bg-black/90"
      accessibilityRole="toolbar"
      accessibilityLabel={t("navigation.bar")}
    >
      {dragged === null ? null : (
        <View
          pointerEvents="none"
          className="absolute inset-x-0 -top-12 items-center"
        >
          <View className="bg-popover border-border rounded-full border px-4 py-2 shadow-lg">
            <Text weight="semibold" accessibilityLiveRegion="polite">
              {label(dragged)}
            </Text>
          </View>
        </View>
      )}
      <View
        style={{ height: READER_BOTTOM_BAR_HEIGHT }}
        className="flex-row items-center gap-3 px-3"
      >
        {returnPage === undefined ? null : (
          <Button
            variant="ghost"
            size="sm"
            accessibilityLabel={t("navigation.returnTo", {
              page: formatNumber(returnPage),
            })}
            startContent={<RotateCcwIcon size={18} />}
            onPress={onReturn}
          >
            {formatNumber(returnPage)}
          </Button>
        )}
        <Direction dir="rtl" className="flex-1">
          <Slider
            min={min}
            max={max}
            step={1}
            value={dragged ?? value}
            label={
              mode === "page"
                ? t("navigation.scrubPage")
                : t("navigation.scrubSurah")
            }
            headerClassName="hidden"
            formatValue={label}
            onValueChange={(next) => {
              if (dragged === null) {
                onScrubberHold();
              }
              setDragged(next);
            }}
            onValueCommit={(next) => {
              setDragged(null);
              onScrubberRelease();
              if (next !== value) {
                onJump(scrubberTarget(mode, next));
              }
            }}
          />
        </Direction>
      </View>
    </Animated.View>
  );
};
