import { createFileRoute } from "@tanstack/react-router";

import { LessonEditScreen } from "@/features/admin-lessons";

const LessonEditRoute = () => <LessonEditScreen id={Route.useParams().id} />;

export const Route = createFileRoute("/admin/_authed/lessons/$id")({
  component: LessonEditRoute,
});
