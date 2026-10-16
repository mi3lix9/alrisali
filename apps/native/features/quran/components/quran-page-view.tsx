import { getQuranPage, SURAHS } from "@alrisali/content/quran";
import type { AyahKey, QuranLine, QuranWord } from "@alrisali/content/quran";
import { pagePosition } from "@alrisali/domain/quran";
import { Text } from "panelui-native";
import { memo, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Pressable, View } from "react-native";
import type { TextLayoutEvent } from "react-native";

import { formatNumber } from "@/shared/lib/numbers";

import { QURAN_FONT } from "../hooks/use-quran-font";
import { hizbLabel } from "../utils/format";
import { usePageColors } from "./page-colors";

/** Every Quran Page has room for 15 lines; pages 1 and 2 centre fewer. */
const LINE_SLOTS = 15;
const OPENING_PAGES = new Set([1, 2]);
/** The thin header (juz, surah) and footer (page, hizb) bands. */
const BAND_HEIGHT = 28;
const SIDE_PADDING = 12;
/** Lines are measured at this size, then the page is scaled to fit. */
const MEASURE_SIZE = 20;
/**
 * The glyphs' tallest marks need this much of a line slot. Text is given
 * the whole slot as its line height: Panel UI's `Text` carries the line
 * height of its `text-base` size, which clips the marks off a bigger font.
 */
const FONT_TO_SLOT = 0.62;
/** Keeps a hair of room so a fitted line never wraps. */
const FIT_MARGIN = 0.98;
/** A line narrower than this share of the width is centred, not stretched. */
const STRETCH_THRESHOLD = 0.6;

export interface AyahGestures {
  /** A plain tap anywhere on the page, ayat included: toggles the chrome. */
  onTap: () => void;
  onLongPressAyah: (ayah: AyahKey) => void;
  /** A finger came down on an ayah: it lights at once, before a long-press. */
  onPressInAyah: (ayah: AyahKey) => void;
  /** The finger lifted or left the ayah. */
  onPressOut: () => void;
  /** The ayah whose sheet is open, or being recited, drawn highlighted. */
  selectedAyah: AyahKey | null;
  /** The ayah under the finger, drawn highlighted like the selected one. */
  pressingAyah: AyahKey | null;
  /** The Last-Read Ayah, its rosette drawn in the accent colour. */
  lastReadAyah: AyahKey | null;
}

interface QuranPageViewProps extends AyahGestures {
  page: number;
  width: number;
  height: number;
  /** Space the device keeps clear at the top and bottom (notch, home bar). */
  insetTop: number;
  insetBottom: number;
}

interface PageFit {
  fontSize: number;
  /** Each line's width at `fontSize`; 0 for header and basmala lines. */
  lineWidths: number[];
}

/** Measured fits, so a page is measured once per width. */
const fits = new Map<string, PageFit>();

const lineText = (line: QuranLine): string =>
  line.kind === "ayah"
    ? line.words.map((word) => word.text).join(" ")
    : line.text;

const wordKey = (word: QuranWord): AyahKey => `${word.surah}:${word.ayah}`;

interface WordProps extends Omit<
  AyahGestures,
  "selectedAyah" | "pressingAyah" | "lastReadAyah"
> {
  word: QuranWord;
  fontSize: number;
  selected: boolean;
  lastRead: boolean;
}

const Word = ({
  word,
  fontSize,
  selected,
  lastRead,
  onTap,
  onLongPressAyah,
  onPressInAyah,
  onPressOut,
}: WordProps) => {
  const colors = usePageColors();
  return (
    <Text
      onPress={onTap}
      onLongPress={() => onLongPressAyah(wordKey(word))}
      onPressIn={() => onPressInAyah(wordKey(word))}
      onPressOut={onPressOut}
      suppressHighlighting
      style={{
        backgroundColor: selected ? colors.highlight : undefined,
        color: lastRead && word.isAyahEnd ? colors.accent : colors.text,
        fontFamily: QURAN_FONT,
        fontSize,
        lineHeight: fontSize / FONT_TO_SLOT,
        writingDirection: "rtl",
      }}
    >
      {word.text}
    </Text>
  );
};

interface LineProps extends AyahGestures {
  line: QuranLine;
  fontSize: number;
  height: number;
  stretch: boolean;
}

const Line = ({
  line,
  fontSize,
  height,
  stretch,
  onTap,
  onLongPressAyah,
  onPressInAyah,
  onPressOut,
  selectedAyah,
  pressingAyah,
  lastReadAyah,
}: LineProps) => {
  const { t } = useTranslation("quran");
  const colors = usePageColors();
  if (line.kind !== "ayah") {
    const header = line.kind === "surah-header";
    return (
      <View
        style={[
          { height },
          header
            ? {
                backgroundColor: colors.plate,
                borderColor: colors.border,
                borderWidth: 1,
              }
            : null,
        ]}
        className={header ? "justify-center rounded-md" : "justify-center"}
        accessibilityRole={header ? "header" : undefined}
        accessibilityLabel={
          header ? t("page.surah", { name: line.text }) : undefined
        }
      >
        <Text
          numberOfLines={1}
          adjustsFontSizeToFit
          style={{
            color: colors.text,
            fontFamily: QURAN_FONT,
            fontSize,
            lineHeight: fontSize / FONT_TO_SLOT,
            textAlign: "center",
            writingDirection: "rtl",
          }}
        >
          {line.text}
        </Text>
      </View>
    );
  }
  return (
    <View
      style={{ height, direction: "rtl", gap: stretch ? 0 : fontSize * 0.3 }}
      className={`flex-row items-center ${stretch ? "justify-between" : "justify-center"}`}
    >
      {line.words.map((word, index) => (
        <Word
          // Words never reorder within a line.
          // oxlint-disable-next-line react/no-array-index-key
          key={index}
          word={word}
          fontSize={fontSize}
          selected={
            selectedAyah === wordKey(word) || pressingAyah === wordKey(word)
          }
          lastRead={lastReadAyah === wordKey(word)}
          onTap={onTap}
          onLongPressAyah={onLongPressAyah}
          onPressInAyah={onPressInAyah}
          onPressOut={onPressOut}
        />
      ))}
    </View>
  );
};

/**
 * One Quran Page as printed: a thin band with the juz and surah, the lines
 * exactly where KFGQPC set them, each stretched edge to edge (React Native's
 * `justify` handles Arabic poorly, so the words are spread across the row),
 * and a footer with the page number and hizb.
 */
const PageView = ({
  page,
  width,
  height,
  insetTop,
  insetBottom,
  onTap,
  onLongPressAyah,
  onPressInAyah,
  onPressOut,
  selectedAyah,
  pressingAyah,
  lastReadAyah,
}: QuranPageViewProps) => {
  const { t, i18n } = useTranslation("quran");
  const colors = usePageColors();
  const quranPage = useMemo(() => getQuranPage(page), [page]);
  const position = pagePosition(page);
  const surah = SURAHS[position.surah - 1];
  const fitKey = `${page}:${width}`;
  // A fit measured here lives in state: the React Compiler memoises
  // `fits.get(fitKey)` on `fitKey`, so a fit written to the cache after the
  // first render would never be read back and the page would stay blank.
  // The cache only spares pages already measured another measuring pass.
  const [measured, setMeasured] = useState<{ key: string; fit: PageFit }>();
  const fit = measured?.key === fitKey ? measured.fit : fits.get(fitKey);

  const linesWidth = width - SIDE_PADDING * 2;
  const linesHeight = height - insetTop - insetBottom - BAND_HEIGHT * 2;
  const slotHeight = linesHeight / LINE_SLOTS;
  const opening = OPENING_PAGES.has(page);

  const onMeasured = ({ nativeEvent }: TextLayoutEvent) => {
    const widths = quranPage.lines.map((line, index) =>
      line.kind === "ayah" ? (nativeEvent.lines[index]?.width ?? 0) : 0
    );
    const widest = Math.max(...widths);
    const fontSize = Math.min(
      (MEASURE_SIZE * linesWidth * FIT_MARGIN) / widest,
      slotHeight * FONT_TO_SLOT
    );
    const next: PageFit = {
      fontSize,
      lineWidths: widths.map(
        (lineWidth) => (lineWidth * fontSize) / MEASURE_SIZE
      ),
    };
    fits.set(fitKey, next);
    setMeasured({ key: fitKey, fit: next });
  };

  const gestures = {
    onTap,
    onLongPressAyah,
    onPressInAyah,
    onPressOut,
    selectedAyah,
    pressingAyah,
    lastReadAyah,
  };

  return (
    <Pressable
      onPress={onTap}
      accessible={false}
      testID={`quran-page-${page}`}
      style={{
        width,
        height,
        paddingTop: insetTop,
        paddingBottom: insetBottom,
        paddingHorizontal: SIDE_PADDING,
        backgroundColor: colors.background,
      }}
      className="overflow-hidden"
    >
      <View
        style={{ height: BAND_HEIGHT, direction: "rtl" }}
        className="flex-row items-end justify-between"
      >
        <Text size="xs" style={{ color: colors.mutedText }}>
          {t("page.juz", { juz: formatNumber(position.juz) })}
        </Text>
        <Text size="xs" style={{ color: colors.mutedText }}>
          {i18n.language === "ar" ? surah?.nameAr : surah?.nameEn}
        </Text>
      </View>
      <View
        className="flex-1 justify-center"
        accessibilityLabel={t("page.label", {
          page: formatNumber(page),
        })}
      >
        {fit ? (
          quranPage.lines.map((line, index) => (
            <Line
              // Lines never reorder within a page.
              // oxlint-disable-next-line react/no-array-index-key
              key={index}
              line={line}
              fontSize={fit.fontSize}
              height={opening ? fit.fontSize * 2.2 : slotHeight}
              stretch={
                !opening &&
                (fit.lineWidths[index] ?? 0) >= linesWidth * STRETCH_THRESHOLD
              }
              {...gestures}
            />
          ))
        ) : (
          <View
            style={{ position: "absolute", width: 10_000, opacity: 0 }}
            pointerEvents="none"
          >
            <Text
              onTextLayout={onMeasured}
              style={{ fontFamily: QURAN_FONT, fontSize: MEASURE_SIZE }}
            >
              {quranPage.lines.map(lineText).join("\n")}
            </Text>
          </View>
        )}
      </View>
      <View
        style={{ height: BAND_HEIGHT }}
        className="flex-row items-center justify-center gap-2"
      >
        <Text size="sm" weight="semibold" style={{ color: colors.mutedText }}>
          {formatNumber(page)}
        </Text>
        <Text size="xs" style={{ color: colors.mutedText }}>
          {hizbLabel(t, position)}
        </Text>
      </View>
    </Pressable>
  );
};

/** A page redraws only when its own props change, not on every page turn. */
export const QuranPageView = memo(PageView);
