import { createFileRoute } from "@tanstack/react-router";

import { SignInScreen } from "@/features/admin";

export const Route = createFileRoute("/login")({
  component: SignInScreen,
});
