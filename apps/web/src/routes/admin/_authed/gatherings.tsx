import { createFileRoute } from "@tanstack/react-router";

import { GatheringsScreen } from "@/features/admin-gatherings";

export const Route = createFileRoute("/admin/_authed/gatherings")({
  component: GatheringsScreen,
});
