import { Link, useLocation } from "@tanstack/react-router";
import type { ReactNode } from "react";

import { useSiteLocale } from "../hooks/use-site-locale";
import { localePath } from "../utils/locale";

const navLinkClass =
  "text-muted-foreground hover:text-foreground data-[status=active]:text-foreground";

export const SiteLayout = ({ children }: { children: ReactNode }) => {
  const { locale, copy, params } = useSiteLocale();
  const { pathname } = useLocation();
  const otherLocale = locale === "ar" ? "en" : "ar";

  return (
    <div className="bg-background text-foreground flex min-h-svh flex-col">
      <header className="border-b">
        <div className="container mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-4 px-4 py-3">
          <Link
            to="/{-$locale}"
            params={params}
            className="text-lg font-semibold"
          >
            {copy.appName}
          </Link>
          <nav className="flex flex-wrap items-center gap-4 text-sm">
            <Link
              to="/{-$locale}/privacy"
              params={params}
              className={navLinkClass}
            >
              {copy.nav.privacy}
            </Link>
            <Link
              to="/{-$locale}/terms"
              params={params}
              className={navLinkClass}
            >
              {copy.nav.terms}
            </Link>
            <Link
              to="/{-$locale}/contact"
              params={params}
              className={navLinkClass}
            >
              {copy.nav.contact}
            </Link>
            {/* A plain link: a typed Link merges the current params, so it cannot drop `/en`. */}
            <a
              href={localePath(pathname, otherLocale)}
              hrefLang={otherLocale}
              lang={otherLocale}
              className="hover:bg-muted border px-2 py-1"
            >
              {copy.nav.otherLanguage}
            </a>
          </nav>
        </div>
      </header>
      <main className="flex-1">{children}</main>
      <footer className="border-t">
        <div className="text-muted-foreground container mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-4 px-4 py-6 text-sm">
          <span>{copy.appName}</span>
          <nav className="flex gap-4">
            <Link to="/{-$locale}/privacy" params={params}>
              {copy.nav.privacy}
            </Link>
            <Link to="/{-$locale}/terms" params={params}>
              {copy.nav.terms}
            </Link>
            <Link to="/{-$locale}/contact" params={params}>
              {copy.nav.contact}
            </Link>
          </nav>
        </div>
      </footer>
    </div>
  );
};
