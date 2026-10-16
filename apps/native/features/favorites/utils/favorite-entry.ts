import { getSupplication } from "@alrisali/content/books";
import { AYAT, SURAHS } from "@alrisali/content/quran";
import type { Favorite } from "@alrisali/db-user/favorites";
import type { Href } from "expo-router";

import { launchLanguage } from "@/shared/lib/preferences";

/** What the Favorites list shows for a Favorite, and where it opens. */
export type FavoriteEntry =
  | {
      kind: "surah" | "supplication" | "library-asset";
      title: string;
      href: Href;
    }
  | {
      kind: "ayah";
      surah: string;
      ayah: number;
      href: Href;
    };

/**
 * Resolves a Favorite against the bundled content, and a Library Asset through
 * `libraryAssetTitle` (Library Assets come from the content replica, which
 * this feature cannot read). Undefined when the content is not on this
 * device: a Supplication a newer app added, or a Library Asset that was
 * unpublished or is not pulled yet.
 */
export const favoriteEntry = (
  favorite: Favorite,
  libraryAssetTitle?: (id: string) => string | undefined
): FavoriteEntry | undefined => {
  switch (favorite.kind) {
    case "surah": {
      const number = Number(favorite.key);
      const surah = SURAHS[number - 1];
      const opening = AYAT.find(
        (ayah) => ayah.surah === number && ayah.ayah === 1
      );
      return surah && opening
        ? {
            kind: "surah",
            title: launchLanguage === "ar" ? surah.nameAr : surah.nameEn,
            href: {
              pathname: "/quran",
              params: { page: String(opening.page) },
            },
          }
        : undefined;
    }
    case "ayah": {
      const ayah = AYAT.find((candidate) => candidate.key === favorite.key);
      const surah = ayah ? SURAHS[ayah.surah - 1] : undefined;
      return ayah && surah
        ? {
            kind: "ayah",
            surah: launchLanguage === "ar" ? surah.nameAr : surah.nameEn,
            ayah: ayah.ayah,
            href: { pathname: "/quran", params: { page: String(ayah.page) } },
          }
        : undefined;
    }
    case "supplication": {
      const supplication = getSupplication(favorite.key);
      return supplication
        ? {
            kind: "supplication",
            title: supplication.title[launchLanguage],
            href: {
              pathname: "/library/supplication/[id]",
              params: { id: supplication.id },
            },
          }
        : undefined;
    }
    case "library-asset": {
      const title = libraryAssetTitle?.(favorite.key);
      return title === undefined
        ? undefined
        : {
            kind: "library-asset",
            title,
            href: {
              pathname: "/library/asset/[id]",
              params: { id: favorite.key },
            },
          };
    }
    default: {
      return undefined;
    }
  }
};
