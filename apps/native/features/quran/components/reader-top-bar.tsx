import { SURAHS } from "@alrisali/content/quran";
import type { PagePosition, ReaderMode } from "@alrisali/domain/quran";
import { Button, Text } from "panelui-native";
import {
  ChevronLeftIcon,
  EllipsisIcon,
  ListIcon,
  SearchIcon,
} from "panelui-native/icons";
import { useTranslation } from "react-i18next";
import { View } from "react-native";
import Animated, { FadeIn, FadeOut } from "react-native-reanimated";

import { formatNumber } from "../utils/format";

interface ReaderTopBarProps {
  mode: ReaderMode;
  /** Where Page Mode is, or where the open surah starts. */
  position: PagePosition;
  surah: number;
  insetTop: number;
  onBack: () => void;
  onIndex: () => void;
  onSearch: () => void;
  onSettings: () => void;
}

/**
 * The reader's top bar, laid over the page (no layout shift) while the chrome
 * shows: back, the index, the surah with its juz and page, search, and the reader
 * settings.
 */
export const ReaderTopBar = ({
  mode,
  position,
  surah,
  insetTop,
  onBack,
  onIndex,
  onSearch,
  onSettings,
}: ReaderTopBarProps) => {
  const { t, i18n } = useTranslation("quran");
  const entry = SURAHS[surah - 1];
  const format = (value: number) => formatNumber(i18n.language, value);
  const subtitle =
    mode === "page"
      ? t("chrome.position", {
          juz: format(position.juz),
          page: format(position.page),
        })
      : t("chrome.surahNumber", { number: format(surah) });

  return (
    <Animated.View
      entering={FadeIn.duration(150)}
      exiting={FadeOut.duration(150)}
      style={{ paddingTop: insetTop }}
      className="bg-background/95 border-border absolute inset-x-0 top-0 border-b dark:bg-black/90"
      accessibilityRole="toolbar"
      accessibilityLabel={t("chrome.label")}
    >
      <View className="h-14 flex-row items-center gap-2 px-2">
        <Button
          variant="ghost"
          size="icon"
          accessibilityLabel={t("chrome.back")}
          onPress={onBack}
        >
          <ChevronLeftIcon size={22} />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          accessibilityLabel={t("navigation.index")}
          onPress={onIndex}
        >
          <ListIcon size={22} />
        </Button>
        <View className="flex-1 items-center">
          <Text weight="semibold" numberOfLines={1}>
            {i18n.language === "ar" ? entry?.nameAr : entry?.nameEn}
          </Text>
          <Text size="xs" muted numberOfLines={1}>
            {subtitle}
          </Text>
        </View>
        <Button
          variant="ghost"
          size="icon"
          accessibilityLabel={t("navigation.search")}
          onPress={onSearch}
        >
          <SearchIcon size={22} />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          accessibilityLabel={t("chrome.settings")}
          onPress={onSettings}
        >
          <EllipsisIcon size={22} />
        </Button>
      </View>
    </Animated.View>
  );
};
