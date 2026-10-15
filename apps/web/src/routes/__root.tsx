import { Toaster } from "@alrisali/ui/components/sonner";
import type { QueryClient } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import {
  HeadContent,
  Outlet,
  Scripts,
  createRootRouteWithContext,
  useMatch,
} from "@tanstack/react-router";
import { TanStackRouterDevtools } from "@tanstack/react-router-devtools";

import { directionOf, parseLocaleParam } from "@/features/landing";
import type { orpc } from "@/shared/lib/orpc";

import appCss from "../index.css?url";

export interface RouterAppContext {
  orpc: typeof orpc;
  queryClient: QueryClient;
}

// Public pages take their language from the URL; the admin pages are English.
const RootDocument = () => {
  const site = useMatch({ from: "/{-$locale}", shouldThrow: false });
  const locale = (site && parseLocaleParam(site.params.locale)) ?? "en";

  return (
    <html lang={locale} dir={directionOf(locale)} className="dark">
      <head>
        <HeadContent />
      </head>
      <body>
        <Outlet />
        <Toaster richColors />
        <TanStackRouterDevtools position="bottom-left" />
        <ReactQueryDevtools position="bottom" buttonPosition="bottom-right" />
        <Scripts />
      </body>
    </html>
  );
};
export const Route = createRootRouteWithContext<RouterAppContext>()({
  head: () => ({
    meta: [
      {
        charSet: "utf-8",
      },
      {
        name: "viewport",
        content: "width=device-width, initial-scale=1",
      },
      {
        title: "Al-Risali",
      },
    ],
    links: [
      {
        rel: "stylesheet",
        href: appCss,
      },
    ],
  }),

  component: RootDocument,
});
