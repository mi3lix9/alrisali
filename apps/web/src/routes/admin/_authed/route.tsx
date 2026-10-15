import { Outlet, createFileRoute } from "@tanstack/react-router";

import { AdminGate, AdminLayout, requireSession } from "@/features/admin";

const AuthedRoute = () => (
  <AdminLayout>
    <AdminGate session={Route.useRouteContext().session}>
      <Outlet />
    </AdminGate>
  </AdminLayout>
);

export const Route = createFileRoute("/admin/_authed")({
  ssr: false,
  component: AuthedRoute,
  beforeLoad: requireSession,
});
