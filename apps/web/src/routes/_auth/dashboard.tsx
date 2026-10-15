import { createFileRoute } from "@tanstack/react-router";

import { DashboardScreen } from "@/features/admin";

const RouteComponent = () => (
  <DashboardScreen session={Route.useRouteContext().session} />
);

export const Route = createFileRoute("/_auth/dashboard")({
  component: RouteComponent,
});
