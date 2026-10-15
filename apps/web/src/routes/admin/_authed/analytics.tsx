import { createFileRoute } from "@tanstack/react-router";

import { AnalyticsScreen } from "@/features/admin-analytics";

export const Route = createFileRoute("/admin/_authed/analytics")({
  component: AnalyticsScreen,
});
