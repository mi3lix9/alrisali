import { Outlet, createFileRoute } from "@tanstack/react-router";

import { requireSession } from "@/features/admin";

export const Route = createFileRoute("/_auth")({
  ssr: false,
  component: Outlet,
  beforeLoad: requireSession,
});
