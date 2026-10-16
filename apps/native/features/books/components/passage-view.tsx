import type { Passage } from "@alrisali/content/books";
import { readerLineHeight } from "@alrisali/domain/books";
import type { ReaderFormat } from "@alrisali/domain/books";
import { Direction, Text } from "panelui-native";
import type { ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { View } from "react-native";

import { formatNumber } from "@/shared/lib/numbers";

import type { ReaderLanguage } from "../hooks/use-reader-preferences";
import type { ReaderColors } from "../utils/reader-theme";

// English runs smaller than Arabic at the same point size reads.
const ENGLISH_SCALE = 0.75;

export interface PassageViewProps {
  passage: Pick<Passage, "ar" | "en">;
  language: ReaderLanguage;
  format: ReaderFormat;
  /** The face to set Arabic in; undefined for the device's. */
  fontFamily: string | undefined;
  /** The reading theme's ink; undefined follows the app theme. */
  colors: ReaderColors | undefined;
  /** The section's number, from 1; omitted in the format sample. */
  number?: number;
  /** Marks the section the reader continued at. */
  highlighted?: boolean;
  /** A tap counter for a phrase the passage asks to repeat, shown under it. */
  counter?: ReactNode;
}

/** One section of a Supplication, set in the Believer's reading format. */
export const PassageView = ({
  passage,
  language,
  format,
  fontFamily,
  colors,
  number,
  highlighted = false,
  counter,
}: PassageViewProps) => {
  const { t } = useTranslation("books");
  const { fontSize, spacing } = format;
  const englishSize = Math.round(fontSize * ENGLISH_SCALE);
  const showArabic = language !== "en" && passage.ar.length > 0;
  const showEnglish = language !== "ar" && passage.en !== undefined;
  const ink = colors ? { color: colors.text } : undefined;

  return (
    <View
      className={`gap-2 py-4 ${number === undefined ? "" : "border-border border-b"} ${highlighted ? "border-s-primary border-s-2 ps-3" : ""}`}
    >
      {number === undefined ? null : (
        <Text
          size="sm"
          muted
          style={ink && { ...ink, opacity: 0.55 }}
          accessibilityLabel={t("reader.section", {
            number: formatNumber(number),
          })}
        >
          {formatNumber(number)}
        </Text>
      )}
      {showArabic ? (
        <Direction dir="rtl">
          <Text
            selectable
            style={{
              fontSize,
              lineHeight: readerLineHeight(spacing, fontSize),
              fontFamily,
              ...ink,
            }}
          >
            {passage.ar}
          </Text>
        </Direction>
      ) : null}
      {showEnglish ? (
        <Direction dir="ltr">
          <Text
            selectable
            muted={language === "both" && !ink}
            style={{
              fontSize: englishSize,
              lineHeight: readerLineHeight(spacing, englishSize),
              ...(ink && {
                ...ink,
                opacity: language === "both" ? 0.75 : 1,
              }),
            }}
          >
            {passage.en}
          </Text>
        </Direction>
      ) : null}
      {counter}
    </View>
  );
};
