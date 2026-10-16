import { searchQuran } from "@alrisali/domain/quran";
import type { JumpTarget } from "@alrisali/domain/quran";
import {
  Badge,
  BottomSheet,
  Direction,
  Input,
  Item,
  Text,
} from "panelui-native";
import { SearchIcon } from "panelui-native/icons";
import { useDeferredValue, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { View } from "react-native";

import { formatNumber } from "@/shared/lib/numbers";
import { ClearSearchButton } from "@/shared/ui/search-panel";

import { QURAN_FONT } from "../hooks/use-quran-font";
import { surahName } from "../utils/format";

interface SearchFormProps {
  onSelect: (target: JumpTarget) => void;
}

const SearchForm = ({ onSelect }: SearchFormProps) => {
  const { t, i18n } = useTranslation("quran");

  const [query, setQuery] = useState("");
  // Typing stays responsive while the 6236 ayat are scanned.
  const deferred = useDeferredValue(query);
  const result = useMemo(() => searchQuran(deferred), [deferred]);
  const empty =
    deferred.trim() !== "" &&
    result.surahs.length === 0 &&
    result.ayat.length === 0;

  return (
    <View className="gap-3">
      <Input
        value={query}
        onChangeText={setQuery}
        placeholder={t("navigation.searchPlaceholder")}
        accessibilityLabel={t("navigation.search")}
        startContent={<SearchIcon size={18} />}
        endContent={
          <ClearSearchButton query={query} onClear={() => setQuery("")} />
        }
        autoFocus
        autoCorrect={false}
        autoCapitalize="none"
        returnKeyType="search"
      />
      {deferred.trim() === "" ? (
        <Text size="sm" muted>
          {t("navigation.searchHint", { surah: 2, ayah: 255 })}
        </Text>
      ) : null}
      {empty ? (
        <Text size="sm" muted accessibilityLiveRegion="polite">
          {t("navigation.noResults")}
        </Text>
      ) : null}
      {result.surahs.length > 0 ? (
        <View>
          <Text weight="semibold" accessibilityRole="header">
            {t("navigation.surahs")}
          </Text>
          {result.surahs.map((surah) => (
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
              </Item.Content>
            </Item>
          ))}
        </View>
      ) : null}
      {result.ayat.length > 0 ? (
        <View>
          <Text weight="semibold" accessibilityRole="header">
            {t("navigation.ayat")}
          </Text>
          {result.ayat.map((ayah) => (
            <Item
              key={ayah.key}
              size="sm"
              accessibilityRole="button"
              onPress={() => onSelect({ ayah: ayah.key })}
            >
              <Item.Content>
                <Direction dir="rtl">
                  <Text
                    accessibilityLanguage="ar"
                    numberOfLines={3}
                    style={{
                      fontFamily: QURAN_FONT,
                      fontSize: 20,
                      lineHeight: 38,
                    }}
                  >
                    {ayah.text}
                  </Text>
                </Direction>
                <Item.Description>
                  {t("navigation.ayahRef", {
                    name: surahName(i18n.language, ayah.surah),
                    ayah: formatNumber(ayah.ayah),
                  })}
                </Item.Description>
              </Item.Content>
            </Item>
          ))}
          {result.ayatTotal > result.ayat.length ? (
            <Text size="xs" muted className="pt-2">
              {t("navigation.moreAyat", {
                shown: formatNumber(result.ayat.length),
                total: formatNumber(result.ayatTotal),
              })}
            </Text>
          ) : null}
        </View>
      ) : null}
    </View>
  );
};

interface QuranSearchSheetProps {
  open: boolean;
  onSelect: (target: JumpTarget) => void;
  onClose: () => void;
}

/** Search Surah names and ayah text without typing diacritics. */
export const QuranSearchSheet = ({
  open,
  onSelect,
  onClose,
}: QuranSearchSheetProps) => {
  const { t } = useTranslation("quran");

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
        <BottomSheet.Header title={t("navigation.search")} />
        <BottomSheet.Body
          className="pb-6"
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
        >
          {/* Mounted per opening, so each search starts empty. */}
          {open ? <SearchForm onSelect={onSelect} /> : null}
        </BottomSheet.Body>
      </BottomSheet.Content>
    </BottomSheet>
  );
};
