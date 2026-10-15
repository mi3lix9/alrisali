import { isAdmin } from "@alrisali/auth/roles";
import { Outlet, createFileRoute } from "@tanstack/react-router";

import { AdminGate, AdminLayout, requireSession } from "@/features/admin";
import { UnreadMessagesBadge } from "@/features/admin-contact";

const AuthedRoute = () => {
  const { session } = Route.useRouteContext();
  return (
    <AdminLayout
      messagesBadge={isAdmin(session.user) ? <UnreadMessagesBadge /> : null}
    >
      <AdminGate session={session}>
        <Outlet />
      </AdminGate>
    </AdminLayout>
  );
};

export const Route = createFileRoute("/admin/_authed")({
  ssr: false,
  component: AuthedRoute,
  beforeLoad: requireSession,
});
