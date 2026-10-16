import {
  READER_FONT_SIZE,
  READER_FONTS,
  READER_SPACINGS,
  READER_THEMES,
} from "@alrisali/domain/books";
import type { ReaderFont, ReaderTheme } from "@alrisali/domain/books";
import {
  BottomSheet,
  Button,
  Text,
  toast,
  ToggleButton,
  ToggleButtonGroup,
} from "panelui-native";
import { MinusIcon, PlusIcon, RotateCcwIcon } from "panelui-native/icons";
import { useTranslation } from "react-i18next";
import { Pressable, View } from "react-native";

import { formatNumber } from "@/shared/lib/numbers";

import { useReaderFontFamily } from "../hooks/use-reader-fonts";
import { useReaderPreferences } from "../hooks/use-reader-preferences";
import { READER_THEME_COLORS } from "../utils/reader-theme";
import { PassageView } from "./passage-view";

/** Swatch halves for `system`, which follows the app's light or dark theme. */
const SYSTEM_SWATCH = [READER_THEME_COLORS.light, READER_THEME_COLORS.dark];

const ThemeSwatch = ({
  theme,
  selected,
  onPress,
}: {
  theme: ReaderTheme;
  selected: boolean;
  onPress: () => void;
}) => {
  const { t } = useTranslation("books");
  const halves =
    theme === "system" ? SYSTEM_SWATCH : [READER_THEME_COLORS[theme]];

  return (
    <Pressable
      accessibilityRole="radio"
      accessibilityState={{ selected }}
      accessibilityLabel={t(`reader.format.theme.${theme}`)}
      testID={`books-format-theme-${theme}`}
      className="flex-1 items-center gap-1"
      onPress={onPress}
    >
      <View
        className={`h-12 w-full flex-row overflow-hidden rounded-xl ${selected ? "border-primary border-2" : "border-border border"}`}
      >
        {halves.map((colors) => (
          <View
            key={colors.background}
            className="flex-1 items-center justify-center"
            style={{ backgroundColor: colors.background }}
          >
            <Text style={{ color: colors.text, fontSize: 18 }}>
              {t("reader.format.theme.sample")}
            </Text>
          </View>
        ))}
      </View>
      <Text size="sm">{t(`reader.format.theme.${theme}`)}</Text>
    </Pressable>
  );
};

const FontOption = ({
  font,
  fontFamily,
  selected,
  onPress,
}: {
  font: ReaderFont;
  fontFamily: string | undefined;
  selected: boolean;
  onPress: () => void;
}) => {
  const { t } = useTranslation("books");

  return (
    <Pressable
      accessibilityRole="radio"
      accessibilityState={{ selected }}
      accessibilityLabel={t(`reader.format.font.${font}`)}
      testID={`books-format-font-${font}`}
      className={`flex-1 items-center gap-1 rounded-xl px-1 py-2 ${selected ? "bg-primary" : "bg-muted"}`}
      onPress={onPress}
    >
      <Text
        className={selected ? "text-primary-foreground" : ""}
        style={{ fontFamily, fontSize: 22, lineHeight: 32 }}
      >
        {t("reader.format.font.sample")}
      </Text>
      <Text size="sm" className={selected ? "text-primary-foreground" : ""}>
        {t(`reader.format.font.${font}`)}
      </Text>
    </Pressable>
  );
};

/**
 * Font, size, line spacing and reading theme for the Supplication reader, with
 * a live sample from the open text. Each choice applies at once, to the sample
 * and the reader behind the sheet.
 */
export const FormatSheet = ({
  open,
  sample,
  onClose,
}: {
  open: boolean;
  /** The opening of the open Supplication, set as the sample. */
  sample: string | undefined;
  onClose: () => void;
}) => {
  const { t } = useTranslation("books");
  const preferences = useReaderPreferences();
  const { font, fontSize, spacing, theme } = preferences;
  const { setFormat, stepFontSize, resetFormat } = preferences;
  const fontFamily = useReaderFontFamily();
  const colors = theme === "system" ? undefined : READER_THEME_COLORS[theme];

  return (
    <BottomSheet
      open={open}
      onOpenChange={(next) => {
        if (!next) {
          onClose();
        }
      }}
    >
      <BottomSheet.Content>
        <BottomSheet.Header title={t("reader.format.title")} />
        <BottomSheet.Body className="gap-5 pb-6">
          {sample ? (
            <View
              testID="books-format-sample"
              className={`border-border rounded-2xl border px-4 ${colors ? "" : "bg-card"}`}
              style={colors && { backgroundColor: colors.background }}
            >
              <PassageView
                passage={{ ar: sample }}
                language="ar"
                format={{ font, fontSize, spacing, theme }}
                fontFamily={fontFamily(font)}
                colors={colors}
              />
              <Text
                size="sm"
                muted={!colors}
                className="pb-3"
                style={colors && { color: colors.text, opacity: 0.6 }}
              >
                {t("reader.format.summary", {
                  font: t(`reader.format.font.${font}`),
                  size: formatNumber(fontSize),
                  theme: t(`reader.format.theme.${theme}`),
                })}
              </Text>
            </View>
          ) : null}

          <View className="gap-2" accessibilityRole="radiogroup">
            <Text className="font-semibold">
              {t("reader.format.font.label")}
            </Text>
            <View className="flex-row gap-2">
              {READER_FONTS.map((option) => (
                <FontOption
                  key={option}
                  font={option}
                  fontFamily={fontFamily(option)}
                  selected={option === font}
                  onPress={() => setFormat({ font: option })}
                />
              ))}
            </View>
          </View>

          <View className="flex-row items-center justify-between">
            <Text className="font-semibold">{t("reader.format.size")}</Text>
            <View className="flex-row items-center gap-3">
              <Button
                variant="outline"
                size="icon"
                testID="books-format-smaller"
                accessibilityLabel={t("reader.fontSize.smaller")}
                disabled={fontSize <= READER_FONT_SIZE.min}
                onPress={() => stepFontSize(-1)}
              >
                <MinusIcon size={18} />
              </Button>
              <Text
                testID="books-format-size"
                style={{ fontVariant: ["tabular-nums"], minWidth: 28 }}
                className="text-center"
              >
                {formatNumber(fontSize)}
              </Text>
              <Button
                variant="outline"
                size="icon"
                testID="books-format-larger"
                accessibilityLabel={t("reader.fontSize.larger")}
                disabled={fontSize >= READER_FONT_SIZE.max}
                onPress={() => stepFontSize(1)}
              >
                <PlusIcon size={18} />
              </Button>
            </View>
          </View>

          <View className="gap-2">
            <Text className="font-semibold">
              {t("reader.format.spacing.label")}
            </Text>
            <ToggleButtonGroup
              selectionMode="single"
              size="sm"
              className="w-full"
              accessibilityLabel={t("reader.format.spacing.label")}
              value={[spacing]}
              onValueChange={([next]) => {
                const selected = READER_SPACINGS.find(
                  (candidate) => candidate === next
                );
                if (selected) {
                  setFormat({ spacing: selected });
                }
              }}
            >
              {READER_SPACINGS.map((option) => (
                <ToggleButton key={option} id={option}>
                  {t(`reader.format.spacing.${option}`)}
                </ToggleButton>
              ))}
            </ToggleButtonGroup>
          </View>

          <View className="gap-2" accessibilityRole="radiogroup">
            <Text className="font-semibold">
              {t("reader.format.theme.label")}
            </Text>
            <View className="flex-row gap-2">
              {READER_THEMES.map((option) => (
                <ThemeSwatch
                  key={option}
                  theme={option}
                  selected={option === theme}
                  onPress={() => setFormat({ theme: option })}
                />
              ))}
            </View>
          </View>

          <View className="flex-row gap-3">
            <Button
              variant="secondary"
              testID="books-format-reset"
              onPress={() => {
                resetFormat();
                toast.show({ label: t("reader.format.resetDone") });
              }}
            >
              <RotateCcwIcon size={18} />
              {t("reader.format.reset")}
            </Button>
            <Button className="flex-1" onPress={onClose}>
              {t("reader.format.done")}
            </Button>
          </View>
        </BottomSheet.Body>
      </BottomSheet.Content>
    </BottomSheet>
  );
};
