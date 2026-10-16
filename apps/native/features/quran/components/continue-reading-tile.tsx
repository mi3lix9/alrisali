import "../i18n";
import { SURAHS } from "@alrisali/content/quran";
import { findAyah } from "@alrisali/domain/quran";
import { router } from "expo-router";
import { useTranslation } from "react-i18next";

import { formatNumber } from "@/shared/lib/numbers";
import { ContinueTile } from "@/shared/ui/continue-tile";

import { useQuranLastRead } from "../data/last-read";

/**
 * The Quran card of Home's Continue row: the Last-Read Ayah, reopening the
 * reader there. Before any reading it offers to start at Al-Fatihah.
 */
export const ContinueReadingTile = () => {
  const { t, i18n } = useTranslation("quran");
  const lastRead = useQuranLastRead();
  const ayah = lastRead.data ? findAyah(lastRead.data.ayah) : undefined;
  const surah = ayah ? SURAHS[ayah.surah - 1] : undefined;

  if (lastRead.isPending) {
    return null;
  }

  return (
    <ContinueTile
      testID="quran-continue-reading"
      label={t("lastRead.continue")}
      title={
        ayah && surah
          ? t("lastRead.position", {
              surah: i18n.language === "ar" ? surah.nameAr : surah.nameEn,
              ayah: formatNumber(ayah.ayah),
              page: formatNumber(ayah.page),
            })
          : t("lastRead.empty")
      }
      onPress={() =>
        router.push({
          pathname: "/quran",
          params: ayah ? { ayah: ayah.key } : { page: "1" },
        })
      }
    />
  );
};
