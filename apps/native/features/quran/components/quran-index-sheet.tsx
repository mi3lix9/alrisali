import {
  ayatOfSurah,
  firstAyahOfJuz,
  firstPageOfSurah,
  INDEX_TABS,
  JUZ_COUNT,
  quartersByJuz,
  sortSurahs,
  SURAH_SORTS,
} from "@alrisali/domain/quran";
import type { IndexTab, JumpTarget, SurahSort } from "@alrisali/domain/quran";
import {
  Badge,
  BottomSheet,
  Item,
  ToggleButton,
  ToggleButtonGroup,
} from "panelui-native";
import { ChevronDownIcon, ChevronUpIcon } from "panelui-native/icons";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { View } from "react-native";

import { formatNumber } from "@/shared/lib/numbers";

import { hizbLabel, surahName } from "../utils/format";
import { PageJumpForm } from "./page-jump-sheet";
import { SavedList } from "./saved-list";
import type { SavedFavorites } from "./saved-list";

const QUARTERS = quartersByJuz();
const JUZ = Array.from({ length: JUZ_COUNT }, (_, index) => index + 1);

interface QuranIndexSheetProps {
  open: boolean;
  /** Marks the surah and juz in view; none outside the reader. */
  current?: { surah: number; juz: number; page: number };
  /** The Favorites its Saved tab lists, drawn by the route. */
  savedFavorites?: SavedFavorites | undefined;
  onSelect: (target: JumpTarget) => void;
  onClose: () => void;
}

/**
 * The Quran index: Surahs (sortable), Juz, hizb Quarters under their juz,
 * and Saved (ribbons and favorites). Each opens where it begins.
 */
export const QuranIndexSheet = ({
  open,
  current,
  savedFavorites,
  onSelect,
  onClose,
}: QuranIndexSheetProps) => {
  const { t, i18n } = useTranslation("quran");
  const [tab, setTab] = useState<IndexTab>("surahs");
  const [sort, setSort] = useState<SurahSort>("number");
  // The juz whose quarters are listed; the one in view starts open.
  const [openJuz, setOpenJuz] = useState<ReadonlySet<number>>(new Set());

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
                const selected = INDEX_TABS.find(
                  (candidate) => candidate === next
                );
                if (selected) {
                  setTab(selected);
                }
              }}
            >
              {INDEX_TABS.map((option) => (
                <ToggleButton
                  key={option}
                  id={option}
                  testID={`quran-index-tab-${option}`}
                >
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
          {tab === "surahs" ? (
            <View className="gap-2">
              <ToggleButtonGroup
                selectionMode="single"
                size="sm"
                accessibilityLabel={t("navigation.sortLabel")}
                value={[sort]}
                onValueChange={([next]) => {
                  const selected = SURAH_SORTS.find(
                    (candidate) => candidate === next
                  );
                  if (selected) {
                    setSort(selected);
                  }
                }}
              >
                {SURAH_SORTS.map((option) => (
                  <ToggleButton
                    key={option}
                    id={option}
                    testID={`quran-index-sort-${option}`}
                  >
                    {t(`navigation.sort.${option}`)}
                  </ToggleButton>
                ))}
              </ToggleButtonGroup>
              {sortSurahs(sort, i18n.language).map((surah) => {
                const place = t(
                  `navigation.revelation.${surah.revelationPlace}`
                );
                const ayat = ayatOfSurah(surah.number).length;
                return (
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
                        {sort === "revelation"
                          ? t("navigation.revelationMeta", {
                              place,
                              order: formatNumber(surah.revelationOrder),
                            })
                          : `${place} · ${t("navigation.surahMeta", {
                              count: ayat,
                              ayat: formatNumber(ayat),
                              page: formatNumber(
                                firstPageOfSurah(surah.number)
                              ),
                            })}`}
                      </Item.Description>
                    </Item.Content>
                    {current?.surah === surah.number ? (
                      <Item.Actions>{currentBadge}</Item.Actions>
                    ) : null}
                  </Item>
                );
              })}
            </View>
          ) : null}
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
          {tab === "quarters"
            ? QUARTERS.map(({ juz, quarters }) => {
                const expanded = openJuz.has(juz) || current?.juz === juz;
                return (
                  <View key={juz}>
                    <Item
                      size="sm"
                      accessibilityRole="button"
                      accessibilityState={{ expanded }}
                      testID={`quran-index-quarters-juz-${juz}`}
                      onPress={() =>
                        setOpenJuz((opened) => {
                          const next = new Set(opened);
                          if (expanded) {
                            next.delete(juz);
                          } else {
                            next.add(juz);
                          }
                          return next;
                        })
                      }
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
                          {t("navigation.quarterCount", {
                            count: quarters.length,
                          })}
                        </Item.Description>
                      </Item.Content>
                      <Item.Actions>
                        {expanded ? (
                          <ChevronUpIcon size={18} />
                        ) : (
                          <ChevronDownIcon size={18} />
                        )}
                      </Item.Actions>
                    </Item>
                    {expanded
                      ? quarters.map((quarter) => (
                          <Item
                            key={quarter.number}
                            size="sm"
                            className="ps-6"
                            accessibilityRole="button"
                            onPress={() => onSelect({ ayah: quarter.ayah.key })}
                          >
                            <Item.Content>
                              <Item.Title>
                                {t("navigation.quarterTitle", {
                                  label: hizbLabel(t, quarter),
                                  name: surahName(
                                    i18n.language,
                                    quarter.ayah.surah
                                  ),
                                  ayah: formatNumber(quarter.ayah.ayah),
                                })}
                              </Item.Title>
                              <Item.Description>
                                {t("navigation.quarterMeta", {
                                  juz: formatNumber(juz),
                                  page: formatNumber(quarter.ayah.page),
                                })}
                              </Item.Description>
                            </Item.Content>
                          </Item>
                        ))
                      : null}
                  </View>
                );
              })
            : null}
          {tab === "saved" ? (
            <SavedList
              favorites={savedFavorites}
              onSelect={onSelect}
              onOpenReader={onClose}
            />
          ) : null}
        </BottomSheet.Body>
      </BottomSheet.Content>
    </BottomSheet>
  );
};
