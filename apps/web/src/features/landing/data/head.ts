import { notFound } from "@tanstack/react-router";

import { siteCopy } from "../i18n";
import { parseLocaleParam } from "../utils/locale";

export type SitePage = "home" | "privacy" | "terms" | "contact";

/** Rejects a `{-$locale}` segment that names no locale, so `/fr` is a 404 rather than an Arabic page. */
export const requireSiteLocale = ({
  params,
}: {
  params: { locale?: string };
}) => {
  if (parseLocaleParam(params.locale) === null) {
    throw notFound();
  }
};

/** Title and description of a public page in the locale of its `{-$locale}` segment. */
export const siteHead =
  (page: SitePage) =>
  ({ params }: { params: { locale?: string } }) => {
    const copy = siteCopy[parseLocaleParam(params.locale) ?? "ar"];
    const { title, description } =
      page === "home"
        ? { title: copy.home.metaTitle, description: copy.home.metaDescription }
        : {
            title: `${copy[page].title} — ${copy.appName}`,
            description: copy[page].description,
          };
    return {
      meta: [{ title }, { name: "description", content: description }],
    };
  };
