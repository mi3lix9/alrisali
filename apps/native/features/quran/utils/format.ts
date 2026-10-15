import { SURAHS } from "@alrisali/content/quran";
import type { PagePosition } from "@alrisali/domain/quran";
import type { TFunction } from "i18next";

const formats = new Map<string, Intl.NumberFormat>();

/** A number in the UI language's digits (Arabic-Indic in Arabic). */
export const formatNumber = (language: string, value: number): string => {
  let format = formats.get(language);
  if (!format) {
    format = new Intl.NumberFormat(language);
    formats.set(language, format);
  }
  return format.format(value);
};

const QUARTER_KEYS = [null, "quarter", "half", "threeQuarters"] as const;

/** "¾ الحزب ٥": the hizb, after the share of it read before the page. */
export const hizbLabel = (
  t: TFunction<"quran">,
  language: string,
  { hizb, quarter }: PagePosition
): string => {
  const label = t("page.hizb", { hizb: formatNumber(language, hizb) });
  const share = QUARTER_KEYS[quarter];
  return share ? `${t(`page.${share}`)} ${label}` : label;
};

/** A surah's name in the UI language. */
export const surahName = (language: string, surah: number): string => {
  const entry = SURAHS[surah - 1];
  if (!entry) {
    return "";
  }
  return language === "ar" ? entry.nameAr : entry.nameEn;
};
