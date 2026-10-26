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
  Item,
  ToggleButton,
  ToggleButtonGroup,
} from "panelui-native";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { View } from "react-native";

import { formatNumber } from "@/shared/lib/numbers";

import { surahName } from "../utils/format";
import { PageJumpForm } from "./page-jump-sheet";

const TABS = ["surahs", "juz", "page"] as const;
type IndexTab = (typeof TABS)[number];

const JUZ = Array.from({ length: JUZ_COUNT }, (_, index) => index + 1);

interface QuranIndexSheetProps {
  open: boolean;
  /** Marks the surah and juz in view; none outside the reader. */
  current?: { surah: number; juz: number; page: number };
  onSelect: (target: JumpTarget) => void;
  onClose: () => void;
}

/**
 * The 114 Surahs and the 30 Juz, each opening where it begins, and a page
 * number to type.
 */
export const QuranIndexSheet = ({
  open,
  current,
  onSelect,
  onClose,
}: QuranIndexSheetProps) => {
  const { t, i18n } = useTranslation("quran");
  const [tab, setTab] = useState<IndexTab>("surahs");

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
          <View className="pt-2">
            <ToggleButtonGroup
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
          </View>
        </BottomSheet.Header>
        <BottomSheet.Body className="pb-6" keyboardShouldPersistTaps="handled">
          {tab === "page" ? (
            <PageJumpForm
              initialPage={current?.page ?? 1}
              onSelect={onSelect}
            />
          ) : null}
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
                      {formatNumber(surah.number)}
                    </Badge>
                  </Item.Media>
                  <Item.Content>
                    <Item.Title>
                      {surahName(i18n.language, surah.number)}
                    </Item.Title>
                    <Item.Description>
                      {t("navigation.surahMeta", {
                        count: ayatOfSurah(surah.number).length,
                        ayat: formatNumber(ayatOfSurah(surah.number).length),
                        page: formatNumber(firstPageOfSurah(surah.number)),
                      })}
                    </Item.Description>
                  </Item.Content>
                  {current?.surah === surah.number ? (
                    <Item.Actions>{currentBadge}</Item.Actions>
                  ) : null}
                </Item>
              ))
            : null}
          {tab === "juz"
            ? JUZ.map((juz) => {
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
                        {formatNumber(juz)}
                      </Badge>
                    </Item.Media>
                    <Item.Content>
                      <Item.Title>
                        {t("navigation.juzTitle", { juz: formatNumber(juz) })}
                      </Item.Title>
                      <Item.Description>
                        {t("navigation.juzMeta", {
                          name: surahName(i18n.language, first.surah),
                          page: formatNumber(first.page),
                        })}
                      </Item.Description>
                    </Item.Content>
                    {current?.juz === juz ? (
                      <Item.Actions>{currentBadge}</Item.Actions>
                    ) : null}
                  </Item>
                );
              })
            : null}
        </BottomSheet.Body>
      </BottomSheet.Content>
    </BottomSheet>
  );
};
