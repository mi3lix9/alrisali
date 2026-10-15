import { createFileRoute } from "@tanstack/react-router";

import { DashboardScreen } from "@/features/admin";

const DashboardRoute = () => (
  <DashboardScreen session={Route.useRouteContext().session} />
);

export const Route = createFileRoute("/admin/_authed/")({
  component: DashboardRoute,
});
