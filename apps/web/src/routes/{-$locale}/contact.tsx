import { createFileRoute } from "@tanstack/react-router";

import { ContactScreen, siteHead } from "@/features/landing";

export const Route = createFileRoute("/{-$locale}/contact")({
  head: siteHead("contact"),
  component: ContactScreen,
});
