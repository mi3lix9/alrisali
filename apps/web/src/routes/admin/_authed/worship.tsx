import { createFileRoute } from "@tanstack/react-router";

import { WorshipMappingScreen } from "@/features/admin-daily-content";

export const Route = createFileRoute("/admin/_authed/worship")({
  component: WorshipMappingScreen,
});
