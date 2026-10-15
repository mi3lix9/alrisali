import {
  PAGE_NAVS,
  READER_MODES,
  SURAH_FONT_SIZE,
} from "@alrisali/domain/quran";
import type { QuranReaderSettings } from "@alrisali/domain/quran";
import { Button, Text, ToggleButton, ToggleButtonGroup } from "panelui-native";
import { MinusIcon, PlusIcon } from "panelui-native/icons";
import { useTranslation } from "react-i18next";
import { View } from "react-native";

import { formatNumber } from "../utils/format";

interface ReaderSettingsControlsProps {
  settings: QuranReaderSettings;
  onChange: (change: Partial<QuranReaderSettings>) => void;
}

/** Reading mode, how pages turn, and the Surah Mode text size. */
export const ReaderSettingsControls = ({
  settings,
  onChange,
}: ReaderSettingsControlsProps) => {
  const { t, i18n } = useTranslation("quran");
  const stepFont = (direction: 1 | -1) =>
    onChange({
      surahFontSize: Math.min(
        SURAH_FONT_SIZE.max,
        Math.max(
          SURAH_FONT_SIZE.min,
          settings.surahFontSize + direction * SURAH_FONT_SIZE.step
        )
      ),
    });

  return (
    <View className="gap-5">
      <View className="gap-2">
        <Text weight="medium">{t("settings.mode.title")}</Text>
        <ToggleButtonGroup
          selectionMode="single"
          size="sm"
          accessibilityLabel={t("settings.mode.title")}
          value={[settings.mode]}
          onValueChange={([next]) => {
            const mode = READER_MODES.find((candidate) => candidate === next);
            if (mode) {
              onChange({ mode });
            }
          }}
        >
          {READER_MODES.map((option) => (
            <ToggleButton key={option} id={option}>
              {t(`settings.mode.${option}`)}
            </ToggleButton>
          ))}
        </ToggleButtonGroup>
      </View>
      <View className="gap-2">
        <Text weight="medium">{t("settings.pageNav.title")}</Text>
        <ToggleButtonGroup
          selectionMode="single"
          size="sm"
          accessibilityLabel={t("settings.pageNav.title")}
          value={[settings.pageNav]}
          onValueChange={([next]) => {
            const pageNav = PAGE_NAVS.find((candidate) => candidate === next);
            if (pageNav) {
              onChange({ pageNav });
            }
          }}
        >
          {PAGE_NAVS.map((option) => (
            <ToggleButton key={option} id={option}>
              {t(`settings.pageNav.${option}`)}
            </ToggleButton>
          ))}
        </ToggleButtonGroup>
      </View>
      <View className="flex-row items-center justify-between gap-3">
        <Text weight="medium">{t("settings.fontSize.title")}</Text>
        <View className="flex-row items-center gap-2">
          <Button
            variant="outline"
            size="icon"
            accessibilityLabel={t("settings.fontSize.smaller")}
            disabled={settings.surahFontSize <= SURAH_FONT_SIZE.min}
            onPress={() => stepFont(-1)}
          >
            <MinusIcon size={18} />
          </Button>
          <Text className="min-w-8 text-center">
            {formatNumber(i18n.language, settings.surahFontSize)}
          </Text>
          <Button
            variant="outline"
            size="icon"
            accessibilityLabel={t("settings.fontSize.larger")}
            disabled={settings.surahFontSize >= SURAH_FONT_SIZE.max}
            onPress={() => stepFont(1)}
          >
            <PlusIcon size={18} />
          </Button>
        </View>
      </View>
    </View>
  );
};
