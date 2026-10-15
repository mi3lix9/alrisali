import { Outlet, createFileRoute } from "@tanstack/react-router";

import { AdminLayout, requireSession } from "@/features/admin";

const AuthRoute = () => (
  <AdminLayout>
    <Outlet />
  </AdminLayout>
);

export const Route = createFileRoute("/_auth")({
  ssr: false,
  component: AuthRoute,
  beforeLoad: requireSession,
});
