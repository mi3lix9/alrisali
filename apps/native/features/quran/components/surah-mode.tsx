import { getQuranPage, SURAHS } from "@alrisali/content/quran";
import {
  ayatOfSurah,
  firstPageOfSurah,
  surahEnd,
} from "@alrisali/domain/quran";
import { Button, Card, Direction, Text } from "panelui-native";
import { ChevronRightIcon } from "panelui-native/icons";
import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { Pressable, ScrollView, View } from "react-native";

import { QURAN_FONT } from "../hooks/use-quran-font";
import { formatNumber } from "../utils/format";
import type { AyahGestures } from "./quran-page-view";

const LINE_HEIGHT = 2;

interface SurahModeProps extends AyahGestures {
  surah: number;
  fontSize: number;
  insetTop: number;
  insetBottom: number;
  onNextSurah: () => void;
  /** The Believer started a scroll. */
  onScrollStart: () => void;
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
  selectedAyah,
}: SurahModeProps) => {
  const { t, i18n } = useTranslation("quran");
  const opening = useOpening(surah);
  const ayat = ayatOfSurah(surah);
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

  return (
    <ScrollView
      // Each surah opens at its top.
      key={surah}
      className="bg-background flex-1 dark:bg-black"
      contentContainerStyle={{
        paddingTop: insetTop + 16,
        paddingBottom: insetBottom + 32,
        paddingHorizontal: 16,
      }}
      onScrollBeginDrag={onScrollStart}
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
                style={{ fontFamily: QURAN_FONT, fontSize: fontSize * 1.1 }}
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
          <Text style={[quranText, { textAlign: "justify" }]}>
            {ayat.map((ayah) => (
              <Text
                key={ayah.key}
                onPress={onTap}
                onLongPress={() => onLongPressAyah(ayah.key)}
                suppressHighlighting
                className={
                  selectedAyah === ayah.key
                    ? "bg-accent text-foreground"
                    : "text-foreground"
                }
              >
                {`${ayah.text} `}
              </Text>
            ))}
          </Text>
        </Direction>
      </Pressable>
      <Card className="mt-8">
        <Card.Content className="items-center gap-3">
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
                  number: formatNumber(i18n.language, next.number),
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
