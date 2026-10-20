import { createFileRoute } from "@tanstack/react-router";

import { AdhansScreen } from "@/features/admin-adhans";

export const Route = createFileRoute("/admin/_authed/adhans")({
  component: AdhansScreen,
});
