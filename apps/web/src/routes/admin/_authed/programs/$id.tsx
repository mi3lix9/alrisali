import { createFileRoute } from "@tanstack/react-router";

import { ProgramEditScreen } from "@/features/admin-programs";

const ProgramEditRoute = () => <ProgramEditScreen id={Route.useParams().id} />;

export const Route = createFileRoute("/admin/_authed/programs/$id")({
  component: ProgramEditRoute,
});
