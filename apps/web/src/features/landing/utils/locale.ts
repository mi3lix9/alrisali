// The public site is Arabic by default: Arabic pages have no locale segment
// (`/privacy`) and English pages carry `/en` (`/en/privacy`).
export type Locale = "ar" | "en";

export const DEFAULT_LOCALE: Locale = "ar";

const LOCALE_PARAMS: Record<string, Locale> = { en: "en" };

/** Locale of an optional `{-$locale}` path segment, or `null` if the segment names no locale. */
export const parseLocaleParam = (param: string | undefined): Locale | null => {
  if (param === undefined) {
    return DEFAULT_LOCALE;
  }
  return LOCALE_PARAMS[param] ?? null;
};

/** Route params for the `{-$locale}` segment of a locale; the default locale has none. */
export const localeParams = (locale: Locale): { locale?: string } =>
  locale === DEFAULT_LOCALE ? {} : { locale };

export const directionOf = (locale: Locale): "rtl" | "ltr" =>
  locale === "ar" ? "rtl" : "ltr";

/** The same page in another locale: `/en/privacy` ⇄ `/privacy`. */
export const localePath = (pathname: string, locale: Locale): string => {
  const arabicPath = pathname.replace(/^\/en(?=\/|$)/u, "") || "/";
  if (locale === DEFAULT_LOCALE) {
    return arabicPath;
  }
  return arabicPath === "/" ? `/${locale}` : `/${locale}${arabicPath}`;
};
