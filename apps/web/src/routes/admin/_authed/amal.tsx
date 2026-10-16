import { createFileRoute } from "@tanstack/react-router";

import { AmalScreen } from "@/features/admin-books";

export const Route = createFileRoute("/admin/_authed/amal")({
  component: AmalScreen,
});
