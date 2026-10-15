import { createFileRoute } from "@tanstack/react-router";

import { OccasionsScreen } from "@/features/admin-occasions";

export const Route = createFileRoute("/admin/_authed/occasions")({
  component: OccasionsScreen,
});
