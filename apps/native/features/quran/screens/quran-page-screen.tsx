import "../i18n";
import { PAGE_COUNT } from "@alrisali/content/quran";
import { Stack, useLocalSearchParams } from "expo-router";
import { Direction, Spinner } from "panelui-native";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { FlatList, View } from "react-native";
import type { LayoutChangeEvent } from "react-native";

import { QuranPageView } from "../components/quran-page-view";
import { useQuranFont } from "../hooks/use-quran-font";

const PAGES = Array.from({ length: PAGE_COUNT }, (_, index) => index + 1);

const clampPage = (value: string | undefined): number => {
  const page = Number(value);
  return Number.isInteger(page) ? Math.min(Math.max(page, 1), PAGE_COUNT) : 1;
};

/**
 * Basic Page Mode: the 604 Quran Pages side by side. The mushaf reads right
 * to left whatever the app language, so the next page lies to the left.
 */
export const QuranPageScreen = () => {
  const { t } = useTranslation("quran");
  const { page } = useLocalSearchParams<{ page?: string }>();
  const fontLoaded = useQuranFont();
  const [size, setSize] = useState<{ width: number; height: number }>();

  const onLayout = ({ nativeEvent }: LayoutChangeEvent) =>
    setSize({
      width: nativeEvent.layout.width,
      height: nativeEvent.layout.height,
    });

  return (
    <Direction dir="rtl" className="bg-background flex-1">
      <Stack.Screen options={{ title: t("title") }} />
      <View className="flex-1" onLayout={onLayout}>
        {fontLoaded && size ? (
          <FlatList
            data={PAGES}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            initialScrollIndex={clampPage(page) - 1}
            getItemLayout={(_, index) => ({
              length: size.width,
              offset: size.width * index,
              index,
            })}
            initialNumToRender={1}
            windowSize={3}
            keyExtractor={String}
            renderItem={({ item }) => (
              <QuranPageView
                page={item}
                width={size.width}
                height={size.height}
              />
            )}
          />
        ) : (
          <View className="flex-1 items-center justify-center">
            <Spinner />
          </View>
        )}
      </View>
    </Direction>
  );
};
