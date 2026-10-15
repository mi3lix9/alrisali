import "../i18n";
import { searchSurahs } from "@alrisali/domain/quran";
import { router } from "expo-router";
import { useMemo } from "react";
import { useTranslation } from "react-i18next";

import type { SearchSection } from "@/shared/ui/search-panel";

import { formatNumber, surahName } from "../utils/format";

/** The Surahs whose name or number matches `query`, each opening the reader at it. */
export const useSurahSearch = (query: string): SearchSection => {
  const { t, i18n } = useTranslation("quran");
  const surahs = useMemo(() => searchSurahs(query), [query]);

  return {
    id: "surahs",
    title: t("navigation.surahs"),
    results: surahs.map(({ number }) => ({
      key: String(number),
      title: surahName(i18n.language, number),
      description: formatNumber(i18n.language, number),
      testID: `search-surah-${number}`,
      open: () =>
        router.push({ pathname: "/quran", params: { surah: String(number) } }),
    })),
  };
};
