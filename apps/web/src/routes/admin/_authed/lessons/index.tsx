import { createFileRoute } from "@tanstack/react-router";

import { LessonsScreen } from "@/features/admin-lessons";

export const Route = createFileRoute("/admin/_authed/lessons/")({
  component: LessonsScreen,
});
