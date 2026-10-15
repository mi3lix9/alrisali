import { createFileRoute } from "@tanstack/react-router";

import { TermsScreen, siteHead } from "@/features/landing";

export const Route = createFileRoute("/{-$locale}/terms")({
  head: siteHead("terms"),
  component: TermsScreen,
});
