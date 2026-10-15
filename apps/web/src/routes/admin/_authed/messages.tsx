import { createFileRoute } from "@tanstack/react-router";

import { InboxScreen } from "@/features/admin-contact";

export const Route = createFileRoute("/admin/_authed/messages")({
  component: InboxScreen,
});
