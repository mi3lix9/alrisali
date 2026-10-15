import { createFileRoute } from "@tanstack/react-router";

import { AnnouncementsScreen } from "@/features/admin-announcements";

export const Route = createFileRoute("/admin/_authed/announcements/")({
  component: AnnouncementsScreen,
});
