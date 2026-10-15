import { createFileRoute } from "@tanstack/react-router";

import { LibraryScreen } from "@/features/admin-library-assets";

export const Route = createFileRoute("/admin/_authed/library")({
  component: LibraryScreen,
});
