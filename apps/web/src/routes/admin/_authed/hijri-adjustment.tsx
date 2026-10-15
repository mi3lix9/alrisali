import { createFileRoute } from "@tanstack/react-router";

import { HijriAdjustmentScreen } from "@/features/admin-hijri-adjustment";

export const Route = createFileRoute("/admin/_authed/hijri-adjustment")({
  component: HijriAdjustmentScreen,
});
