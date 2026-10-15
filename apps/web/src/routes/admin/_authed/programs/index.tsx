import { createFileRoute } from "@tanstack/react-router";

import { ProgramsScreen } from "@/features/admin-programs";

export const Route = createFileRoute("/admin/_authed/programs/")({
  component: ProgramsScreen,
});
