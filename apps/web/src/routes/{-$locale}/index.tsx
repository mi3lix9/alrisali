import { createFileRoute } from "@tanstack/react-router";

import { LandingScreen, siteHead } from "@/features/landing";

export const Route = createFileRoute("/{-$locale}/")({
  head: siteHead("home"),
  component: LandingScreen,
});
