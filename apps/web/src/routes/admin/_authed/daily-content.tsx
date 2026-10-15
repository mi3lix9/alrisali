import { createFileRoute } from "@tanstack/react-router";

import { DailyContentScreen } from "@/features/admin-daily-content";

export const Route = createFileRoute("/admin/_authed/daily-content")({
  component: DailyContentScreen,
});
