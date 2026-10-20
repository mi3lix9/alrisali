import { SURAHS } from "@alrisali/content/quran";
import type { AyahKey } from "@alrisali/content/quran";
import { useCallback } from "react";
import { useTranslation } from "react-i18next";

import { formatNumber } from "@/shared/lib/numbers";

/** Writes an ayah as the Believer reads it: "Al-Baqarah 141". */
export const useAyahLabel = (): ((key: AyahKey) => string) => {
  const { t, i18n } = useTranslation("khatmah");
  return useCallback(
    (key: AyahKey) => {
      const [surah = 0, ayah = 0] = key.split(":").map(Number);
      const entry = SURAHS[surah - 1];
      return t("ayahRef", {
        surah: i18n.language === "ar" ? entry?.nameAr : entry?.nameEn,
        ayah: formatNumber(ayah),
      });
    },
    [t, i18n.language]
  );
};
