import { SURAHS } from "@alrisali/content/quran";
import {
  ayatOfSurah,
  firstAyahOfJuz,
  firstPageOfSurah,
  JUZ_COUNT,
} from "@alrisali/domain/quran";
import type { JumpTarget } from "@alrisali/domain/quran";
import {
  Badge,
  BottomSheet,
  Button,
  Item,
  ToggleButton,
  ToggleButtonGroup,
} from "panelui-native";
import { FileIcon } from "panelui-native/icons";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { View } from "react-native";

import { formatNumber, surahName } from "../utils/format";

const TABS = ["surahs", "juz"] as const;
type IndexTab = (typeof TABS)[number];

const JUZ = Array.from({ length: JUZ_COUNT }, (_, index) => index + 1);

interface QuranIndexSheetProps {
  open: boolean;
  /** Marks the surah and juz in view; none outside the reader. */
  current?: { surah: number; juz: number };
  onSelect: (target: JumpTarget) => void;
  onPageJump: () => void;
  onClose: () => void;
}

/** The 114 Surahs and the 30 Juz, each opening where it begins. */
export const QuranIndexSheet = ({
  open,
  current,
  onSelect,
  onPageJump,
  onClose,
}: QuranIndexSheetProps) => {
  const { t, i18n } = useTranslation("quran");
  const [tab, setTab] = useState<IndexTab>("surahs");
  const format = (value: number) => formatNumber(i18n.language, value);
  const currentBadge = (
    <Badge size="sm" variant="secondary">
      {t("navigation.current")}
    </Badge>
  );

  return (
    <BottomSheet
      open={open}
      onOpenChange={(next) => {
        if (!next) {
          onClose();
        }
      }}
    >
      <BottomSheet.Content size="full">
        <BottomSheet.Header title={t("navigation.index")}>
          <View className="flex-row items-center gap-2 pt-2">
            <ToggleButtonGroup
              className="flex-1"
              selectionMode="single"
              size="sm"
              accessibilityLabel={t("navigation.index")}
              value={[tab]}
              onValueChange={([next]) => {
                const selected = TABS.find((candidate) => candidate === next);
                if (selected) {
                  setTab(selected);
                }
              }}
            >
              {TABS.map((option) => (
                <ToggleButton key={option} id={option}>
                  {t(`navigation.${option}`)}
                </ToggleButton>
              ))}
            </ToggleButtonGroup>
            <Button
              size="sm"
              variant="outline"
              startContent={<FileIcon size={16} />}
              testID="quran-index-page-jump"
              onPress={onPageJump}
            >
              {t("navigation.pageJump")}
            </Button>
          </View>
        </BottomSheet.Header>
        <BottomSheet.Body className="pb-6">
          {tab === "surahs"
            ? SURAHS.map((surah) => (
                <Item
                  key={surah.number}
                  size="sm"
                  accessibilityRole="button"
                  onPress={() => onSelect({ surah: surah.number })}
                >
                  <Item.Media>
                    <Badge size="sm" variant="outline">
                      {format(surah.number)}
                    </Badge>
                  </Item.Media>
                  <Item.Content>
                    <Item.Title>
                      {surahName(i18n.language, surah.number)}
                    </Item.Title>
                    <Item.Description>
                      {t("navigation.surahMeta", {
                        ayat: format(ayatOfSurah(surah.number).length),
                        page: format(firstPageOfSurah(surah.number)),
                      })}
                    </Item.Description>
                  </Item.Content>
                  {current?.surah === surah.number ? (
                    <Item.Actions>{currentBadge}</Item.Actions>
                  ) : null}
                </Item>
              ))
            : JUZ.map((juz) => {
                const first = firstAyahOfJuz(juz);
                return (
                  <Item
                    key={juz}
                    size="sm"
                    accessibilityRole="button"
                    onPress={() => onSelect({ ayah: first.key })}
                  >
                    <Item.Media>
                      <Badge size="sm" variant="outline">
                        {format(juz)}
                      </Badge>
                    </Item.Media>
                    <Item.Content>
                      <Item.Title>
                        {t("navigation.juzTitle", { juz: format(juz) })}
                      </Item.Title>
                      <Item.Description>
                        {t("navigation.juzMeta", {
                          name: surahName(i18n.language, first.surah),
                          page: format(first.page),
                        })}
                      </Item.Description>
                    </Item.Content>
                    {current?.juz === juz ? (
                      <Item.Actions>{currentBadge}</Item.Actions>
                    ) : null}
                  </Item>
                );
              })}
        </BottomSheet.Body>
      </BottomSheet.Content>
    </BottomSheet>
  );
};
