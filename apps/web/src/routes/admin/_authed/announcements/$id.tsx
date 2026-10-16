import { createFileRoute } from "@tanstack/react-router";

import { AnnouncementEditorScreen } from "@/features/admin-announcements";

const AnnouncementRoute = () => (
  <AnnouncementEditorScreen id={Route.useParams().id} />
);

export const Route = createFileRoute("/admin/_authed/announcements/$id")({
  component: AnnouncementRoute,
});
