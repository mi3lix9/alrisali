import {
  pagePosition,
  parseQuranQuery,
  QURAN_QUERY_KINDS,
  searchQuran,
} from "@alrisali/domain/quran";
import type { JumpTarget, QuranQueryCandidate } from "@alrisali/domain/quran";
import {
  Badge,
  BottomSheet,
  Button,
  Direction,
  Input,
  Item,
  Text,
} from "panelui-native";
import { ClockIcon, SearchIcon } from "panelui-native/icons";
import { useDeferredValue, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { View } from "react-native";

import { formatNumber } from "@/shared/lib/numbers";
import { ClearSearchButton } from "@/shared/ui/search-panel";

import {
  useChangeQuranSearchHistory,
  useQuranSearchHistory,
} from "../data/search-history";
import { QURAN_FONT } from "../hooks/use-quran-font";
import { surahName } from "../utils/format";

const GROUP_KEYS = {
  page: "navigation.groupPage",
  surah: "navigation.groupSurah",
  juz: "navigation.groupJuz",
  hizb: "navigation.groupHizb",
  ayah: "navigation.groupAyah",
} as const;

interface SearchFormProps {
  onSelect: (target: JumpTarget) => void;
}

const SearchForm = ({ onSelect }: SearchFormProps) => {
  const { t, i18n } = useTranslation("quran");

  const [query, setQuery] = useState("");
  const { data: history = [] } = useQuranSearchHistory();
  const changeHistory = useChangeQuranSearchHistory();
  /** Opens a result, keeping what was typed as a recent search. */
  const choose = (target: JumpTarget) => {
    changeHistory.mutate(query);
    onSelect(target);
  };
  // Typing stays responsive while the 6236 ayat are scanned.
  const deferred = useDeferredValue(query);
  const result = useMemo(() => searchQuran(deferred), [deferred]);
  const candidates = useMemo(() => parseQuranQuery(deferred), [deferred]);
  // An ayah a candidate already offers is not listed again as a text match.
  const offered = new Set(
    candidates.flatMap((candidate) =>
      candidate.kind === "ayah" ? [candidate.key] : []
    )
  );
  const ayat = result.ayat.filter((ayah) => !offered.has(ayah.key));
  const empty =
    deferred.trim() !== "" && candidates.length === 0 && ayat.length === 0;

  const candidateTitle = (candidate: QuranQueryCandidate): string => {
    switch (candidate.kind) {
      case "page": {
        return t("navigation.candidatePage", { page: candidate.value });
      }
      case "surah": {
        return surahName(i18n.language, candidate.value);
      }
      case "juz": {
        return t("navigation.candidateJuz", { juz: candidate.value });
      }
      case "hizb": {
        return t("navigation.candidateHizb", { hizb: candidate.value });
      }
      case "ayah": {
        return t("navigation.ayahRef", {
          name: surahName(i18n.language, candidate.surah),
          ayah: formatNumber(candidate.ayah),
        });
      }
      default: {
        return "";
      }
    }
  };
  const candidateDescription = (candidate: QuranQueryCandidate): string =>
    candidate.kind === "page"
      ? surahName(i18n.language, pagePosition(candidate.value).surah)
      : "";

  return (
    <View className="gap-3">
      <Input
        testID="quran-search-input"
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
        <View className="gap-1">
          {history.length > 0 ? (
            <View>
              <View className="flex-row items-center justify-between">
                <Text weight="semibold" accessibilityRole="header">
                  {t("navigation.recentSearches")}
                </Text>
                <Button
                  variant="ghost"
                  size="sm"
                  testID="quran-search-clear-history"
                  onPress={() => changeHistory.mutate(null)}
                >
                  {t("navigation.clearSearchHistory")}
                </Button>
              </View>
              {history.map((entry) => (
                <Item
                  key={entry}
                  size="sm"
                  accessibilityRole="button"
                  onPress={() => setQuery(entry)}
                >
                  <Item.Media>
                    <ClockIcon size={16} />
                  </Item.Media>
                  <Item.Content>
                    <Item.Title>{entry}</Item.Title>
                  </Item.Content>
                </Item>
              ))}
            </View>
          ) : null}
          <Text size="sm" muted>
            {t("navigation.searchHint", { surah: 2, ayah: 255 })}
          </Text>
        </View>
      ) : null}
      {empty ? (
        <Text size="sm" muted accessibilityLiveRegion="polite">
          {t("navigation.noResults")}
        </Text>
      ) : null}
      {QURAN_QUERY_KINDS.map((kind) => {
        const group = candidates.filter((candidate) => candidate.kind === kind);
        return group.length > 0 ? (
          <View key={kind}>
            <Text weight="semibold" accessibilityRole="header">
              {t(GROUP_KEYS[kind])}
            </Text>
            {group.map((candidate) => (
              <Item
                key={`${kind}-${candidate.kind === "ayah" ? candidate.key : candidate.value}`}
                size="sm"
                accessibilityRole="button"
                testID={`quran-search-${kind}-${candidate.kind === "ayah" ? candidate.key : candidate.value}`}
                onPress={() => choose(candidate.target)}
              >
                <Item.Media>
                  <Badge size="sm" variant="outline">
                    {formatNumber(
                      candidate.kind === "ayah"
                        ? candidate.ayah
                        : candidate.value
                    )}
                  </Badge>
                </Item.Media>
                <Item.Content>
                  <Item.Title>{candidateTitle(candidate)}</Item.Title>
                  {candidateDescription(candidate) ? (
                    <Item.Description>
                      {candidateDescription(candidate)}
                    </Item.Description>
                  ) : null}
                </Item.Content>
              </Item>
            ))}
          </View>
        ) : null;
      })}
      {ayat.length > 0 ? (
        <View>
          <Text weight="semibold" accessibilityRole="header">
            {t("navigation.ayat")}
          </Text>
          {ayat.map((ayah) => (
            <Item
              key={ayah.key}
              size="sm"
              accessibilityRole="button"
              onPress={() => choose({ ayah: ayah.key })}
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
          {result.ayatTotal > ayat.length ? (
            <Text size="xs" muted className="pt-2">
              {t("navigation.moreAyat", {
                shown: formatNumber(ayat.length),
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
