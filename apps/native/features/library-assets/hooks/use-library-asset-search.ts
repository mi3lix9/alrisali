import "../i18n";
import { searchLibraryAssets } from "@alrisali/domain/library-assets";
import { localized } from "@alrisali/domain/shared";
import { router } from "expo-router";
import { useMemo } from "react";
import { useTranslation } from "react-i18next";

import { launchLanguage } from "@/shared/lib/preferences";
import type { SearchSection } from "@/shared/ui/search-panel";

import { useLibraryAssets } from "../data/library-assets";

/** The Library Assets on the device whose title matches `query`, each opening its viewer. */
export const useLibraryAssetSearch = (query: string): SearchSection => {
  const { t } = useTranslation("library-assets");
  const assets = useLibraryAssets();
  const found = useMemo(
    () => searchLibraryAssets(assets.data ?? [], query),
    [assets.data, query]
  );

  return {
    id: "library-assets",
    title: t("title"),
    results: found.map((asset) => ({
      key: asset.id,
      title: localized(asset.title, launchLanguage),
      description: `${t(`category.${asset.category}`)} · ${t(`kind.${asset.kind}`)}`,
      testID: `search-library-asset-${asset.id}`,
      open: () =>
        router.push({
          pathname: "/library/asset/[id]",
          params: { id: asset.id },
        }),
    })),
  };
};
