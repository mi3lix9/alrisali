import { useParams } from "@tanstack/react-router";

import { siteCopy } from "../i18n";
import {
  DEFAULT_LOCALE,
  localeParams,
  parseLocaleParam,
} from "../utils/locale";

/** The page's locale, its copy and the `{-$locale}` params for links that stay in it. */
export const useSiteLocale = () => {
  const { locale: param } = useParams({ strict: false });
  const locale = parseLocaleParam(param) ?? DEFAULT_LOCALE;
  return { locale, copy: siteCopy[locale], params: localeParams(locale) };
};
