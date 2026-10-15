import { createFileRoute } from "@tanstack/react-router";

import { PrivacyScreen, siteHead } from "@/features/landing";

export const Route = createFileRoute("/{-$locale}/privacy")({
  head: siteHead("privacy"),
  component: PrivacyScreen,
});
