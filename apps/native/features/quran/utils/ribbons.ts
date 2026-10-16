import type { BookmarkRibbon } from "@alrisali/domain/quran";
import { findAyah } from "@alrisali/domain/quran";
import type { TFunction } from "i18next";

import { formatNumber } from "@/shared/lib/numbers";

import { surahName } from "./format";

/** A ribbon's name: the Believer's own, else its colour's default. */
export const ribbonName = (
  t: TFunction<"quran">,
  ribbon: BookmarkRibbon
): string => ribbon.name ?? t(`ribbons.names.${ribbon.color}`);

/** Where a ribbon rests ("Al-Baqarah, ayah 255"), or null while unused. */
export const ribbonPlace = (
  t: TFunction<"quran">,
  language: string,
  ribbon: BookmarkRibbon
): string | null => {
  const ayah = ribbon.ayah ? findAyah(ribbon.ayah) : undefined;
  return ayah
    ? t("ribbons.on", {
        surah: surahName(language, ayah.surah),
        ayah: formatNumber(ayah.ayah),
      })
    : null;
};
