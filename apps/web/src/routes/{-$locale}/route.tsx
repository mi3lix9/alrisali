import { Outlet, createFileRoute } from "@tanstack/react-router";

import { SiteLayout, requireSiteLocale } from "@/features/landing";

const SiteRoute = () => (
  <SiteLayout>
    <Outlet />
  </SiteLayout>
);

export const Route = createFileRoute("/{-$locale}")({
  beforeLoad: requireSiteLocale,
  component: SiteRoute,
});
