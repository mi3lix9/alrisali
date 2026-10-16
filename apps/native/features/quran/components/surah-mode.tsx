import { getQuranPage, SURAHS } from "@alrisali/content/quran";
import type { AyahKey } from "@alrisali/content/quran";
import {
  ayatOfSurah,
  firstPageOfSurah,
  surahEnd,
} from "@alrisali/domain/quran";
import { Button, Card, Direction, Text } from "panelui-native";
import { ChevronRightIcon } from "panelui-native/icons";
import { useMemo, useRef } from "react";
import type { ComponentRef } from "react";
import { useTranslation } from "react-i18next";
import { Pressable, Text as NativeText, ScrollView, View } from "react-native";
import type {
  LayoutChangeEvent,
  NativeScrollEvent,
  NativeSyntheticEvent,
  TextLayoutEvent,
} from "react-native";

import { formatNumber } from "@/shared/lib/numbers";

import { QURAN_FONT } from "../hooks/use-quran-font";
import { rosetteColor } from "../utils/decorations";
import type { AyahGestures } from "./quran-page-view";

const LINE_HEIGHT = 2;

interface SurahModeProps extends AyahGestures {
  surah: number;
  fontSize: number;
  insetTop: number;
  insetBottom: number;
  /**
   * The ayah to open scrolled to, when it is in this surah. Read once, on
   * mount; remount the component to jump again.
   */
  initialAyah?: AyahKey | null | undefined;
  onNextSurah: () => void;
  /** The Believer started a scroll. */
  onScrollStart: () => void;
  /** A Believer's scroll settled with this ayah at the top of the view. */
  onAyahShown?: ((ayah: AyahKey) => void) | undefined;
}

/** Where the surah's text lies in the scroll content, measured on layout. */
interface TextLayout {
  /** The text's top within the scroll content, under the top padding. */
  top: number | null;
  /** Each drawn line's top, bottom and first character offset in the text. */
  lines: { y: number; bottom: number; start: number }[];
}

/** The surah's header band and basmala, as its first page sets them. */
const useOpening = (surah: number) =>
  useMemo(() => {
    const { lines } = getQuranPage(firstPageOfSurah(surah));
    const header = lines.find(
      (line) => line.kind === "surah-header" && line.surah === surah
    );
    const basmala = lines.find(
      (line) => line.kind === "basmala" && line.surah === surah
    );
    return {
      header: header?.kind === "ayah" ? undefined : header?.text,
      basmala: basmala?.kind === "ayah" ? undefined : basmala?.text,
    };
  }, [surah]);

/**
 * Surah Mode: one surah as reflowing text at the Believer's size. It ends
 * with a Next Surah button and never moves on by itself.
 */
export const SurahMode = ({
  surah,
  fontSize,
  insetTop,
  insetBottom,
  onNextSurah,
  onScrollStart,
  onTap,
  onLongPressAyah,
  onPressInAyah,
  onPressOut,
  selectedAyah,
  pressingAyah,
  lastReadAyah,
  decorations,
  initialAyah,
  onAyahShown,
}: SurahModeProps) => {
  const { t, i18n } = useTranslation("quran");
  const opening = useOpening(surah);
  const ayat = useMemo(() => ayatOfSurah(surah), [surah]);
  // Where each ayah starts in the joined text (each ends with a space).
  const starts = useMemo(() => {
    const result: number[] = [];
    let at = 0;
    for (const ayah of ayat) {
      result.push(at);
      at += ayah.text.length + 1;
    }
    return result;
  }, [ayat]);
  const scrollRef = useRef<ComponentRef<typeof ScrollView>>(null);
  const layout = useRef<TextLayout>({ top: null, lines: [] });
  const jumped = useRef(false);
  const dragged = useRef(false);
  const { nextSurah } = surahEnd(surah);
  const next = nextSurah ? SURAHS[nextSurah - 1] : undefined;
  const name = (number: number) => {
    const entry = SURAHS[number - 1];
    return i18n.language === "ar" ? entry?.nameAr : entry?.nameEn;
  };
  const quranText = {
    fontFamily: QURAN_FONT,
    fontSize,
    lineHeight: fontSize * LINE_HEIGHT,
    writingDirection: "rtl" as const,
  };

  // Opens at `initialAyah` once both the text's place and its lines are known.
  const jumpToInitial = () => {
    const { top, lines } = layout.current;
    const index = ayat.findIndex((ayah) => ayah.key === initialAyah);
    if (jumped.current || top === null || lines.length === 0 || index === -1) {
      return;
    }
    jumped.current = true;
    const start = starts[index] ?? 0;
    const line = lines.findLast((candidate) => candidate.start <= start);
    scrollRef.current?.scrollTo({ y: top + (line?.y ?? 0), animated: false });
  };

  const onTextPlaced = ({ nativeEvent }: LayoutChangeEvent) => {
    layout.current.top = nativeEvent.layout.y;
    jumpToInitial();
  };

  const onTextLayout = ({ nativeEvent }: TextLayoutEvent) => {
    let start = 0;
    layout.current.lines = nativeEvent.lines.map((line) => {
      const measured = { y: line.y, bottom: line.y + line.height, start };
      start += line.text.length;
      return measured;
    });
    jumpToInitial();
  };

  const onScrollSettled = ({
    nativeEvent,
  }: NativeSyntheticEvent<NativeScrollEvent>) => {
    const { top, lines } = layout.current;
    if (!dragged.current || !onAyahShown || top === null) {
      return;
    }
    const offset = nativeEvent.contentOffset.y - top;
    const line = lines.find((candidate) => candidate.bottom > offset);
    const start = line?.start ?? 0;
    const index = starts.findLastIndex((ayahStart) => ayahStart <= start);
    const ayah = ayat[Math.max(index, 0)];
    if (ayah) {
      onAyahShown(ayah.key);
    }
  };

  return (
    <ScrollView
      ref={scrollRef}
      // Each surah opens at its top.
      key={surah}
      className="bg-background flex-1 dark:bg-black"
      contentContainerStyle={{
        paddingTop: insetTop + 16,
        paddingBottom: insetBottom + 32,
        paddingHorizontal: 16,
      }}
      onScrollBeginDrag={() => {
        dragged.current = true;
        onScrollStart();
      }}
      onScrollEndDrag={onScrollSettled}
      onMomentumScrollEnd={onScrollSettled}
    >
      <Pressable onPress={onTap} accessible={false}>
        <Direction dir="rtl" className="gap-4">
          {opening.header ? (
            <View
              className="border-border bg-muted rounded-md border py-2"
              accessibilityRole="header"
            >
              <Text
                className="text-center"
                style={{
                  fontFamily: QURAN_FONT,
                  fontSize: fontSize * 1.1,
                  lineHeight: fontSize * 1.1 * LINE_HEIGHT,
                }}
              >
                {opening.header}
              </Text>
            </View>
          ) : null}
          {opening.basmala ? (
            <Text className="text-center" style={quranText}>
              {opening.basmala}
            </Text>
          ) : null}
          <Text
            style={[quranText, { textAlign: "justify" }]}
            onLayout={onTextPlaced}
            onTextLayout={onTextLayout}
          >
            {ayat.map((ayah) => (
              // A bare React Native Text, so each ayah inherits the surah's
              // font size and line height (Panel UI Text would reset them to
              // text-base).
              <NativeText
                key={ayah.key}
                onPress={onTap}
                onLongPress={() => onLongPressAyah(ayah.key)}
                onPressIn={() => onPressInAyah(ayah.key)}
                onPressOut={onPressOut}
                suppressHighlighting
                style={
                  rosetteColor(decorations?.get(ayah.key))
                    ? { color: rosetteColor(decorations?.get(ayah.key)) }
                    : undefined
                }
                className={`${
                  selectedAyah === ayah.key || pressingAyah === ayah.key
                    ? "bg-accent"
                    : ""
                } ${
                  lastReadAyah === ayah.key ? "text-info" : "text-foreground"
                }`}
              >
                {`${ayah.text} `}
              </NativeText>
            ))}
          </Text>
        </Direction>
      </Pressable>
      <Card className="mt-8">
        <Card.Content className="items-center gap-3 pt-6">
          {next ? (
            <>
              <Text size="sm" muted>
                {t("surah.end", { name: name(surah) })}
              </Text>
              <Button
                className="self-stretch"
                onPress={onNextSurah}
                endContent={<ChevronRightIcon size={18} />}
              >
                {t("surah.next", {
                  number: formatNumber(next.number),
                  name: name(next.number),
                })}
              </Button>
            </>
          ) : (
            <Text weight="semibold">{t("surah.completed")}</Text>
          )}
        </Card.Content>
      </Card>
    </ScrollView>
  );
};
