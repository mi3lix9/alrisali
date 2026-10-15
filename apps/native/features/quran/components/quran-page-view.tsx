import { getQuranPage } from "@alrisali/content/quran";
import type { QuranLine } from "@alrisali/content/quran";
import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { Text, View } from "react-native";

import { QURAN_FONT } from "../hooks/use-quran-font";

/** Every Quran Page has room for 15 lines; pages 1 and 2 centre fewer. */
const LINE_SLOTS = 15;
/** Space above and below the lines for the juz and page number. */
const MARGIN_HEIGHT = 28;
const FONT_TO_SLOT = 0.5;
/** A full line holds roughly this many font-sizes of width. */
const LINE_WIDTH_IN_EMS = 17;

const lineText = (line: QuranLine): string =>
  line.kind === "ayah"
    ? line.words.map((word) => word.text).join(" ")
    : line.text;

interface QuranPageViewProps {
  page: number;
  width: number;
  height: number;
}

/** One Quran Page, drawn line for line as KFGQPC typeset it. */
export const QuranPageView = ({ page, width, height }: QuranPageViewProps) => {
  const { t, i18n } = useTranslation("quran");
  const quranPage = useMemo(() => getQuranPage(page), [page]);
  const slotHeight = (height - MARGIN_HEIGHT * 2) / LINE_SLOTS;
  const fontSize = Math.min(
    slotHeight * FONT_TO_SLOT,
    width / LINE_WIDTH_IN_EMS
  );
  const number = new Intl.NumberFormat(i18n.language);

  return (
    <View
      className="bg-background px-3"
      style={{ width, height, direction: "rtl" }}
    >
      <View style={{ height: MARGIN_HEIGHT }} className="justify-end">
        <Text className="text-muted-foreground text-center text-xs">
          {t("page.juz", { juz: number.format(quranPage.juz) })}
        </Text>
      </View>
      <View className="flex-1 justify-center">
        {quranPage.lines.map((line, index) => {
          const text = lineText(line);
          return (
            <View
              // Lines never reorder within a page.
              // oxlint-disable-next-line react/no-array-index-key
              key={index}
              style={{ height: slotHeight }}
              className={
                line.kind === "surah-header"
                  ? "border-border bg-muted justify-center rounded-md border"
                  : "justify-center"
              }
            >
              <Text
                className="text-foreground"
                adjustsFontSizeToFit
                numberOfLines={1}
                style={{
                  fontFamily: QURAN_FONT,
                  fontSize,
                  textAlign: "center",
                  writingDirection: "rtl",
                }}
              >
                {text}
              </Text>
            </View>
          );
        })}
      </View>
      <View style={{ height: MARGIN_HEIGHT }} className="justify-center">
        <Text
          className="text-muted-foreground text-center text-xs"
          accessibilityLabel={t("page.label", { page: number.format(page) })}
        >
          {number.format(page)}
        </Text>
      </View>
    </View>
  );
};
