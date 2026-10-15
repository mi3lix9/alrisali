import { localized } from "@alrisali/domain/shared";
import { useCallback } from "react";

import { launchLanguage } from "@/shared/lib/preferences";

import { useLibraryAssets } from "../data/library-assets";

/**
 * Names a Library Asset by id in the Believer's language: undefined for one
 * not on the device (unpublished, removed, or not pulled yet). For other
 * features' lists, such as the Favorites.
 */
export const useLibraryAssetTitle = (): ((
  id: string
) => string | undefined) => {
  const assets = useLibraryAssets();
  return useCallback(
    (id: string) => {
      const asset = assets.data?.find((candidate) => candidate.id === id);
      return asset ? localized(asset.title, launchLanguage) : undefined;
    },
    [assets.data]
  );
};
