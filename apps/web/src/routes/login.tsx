import { createFileRoute } from "@tanstack/react-router";

import { AdminLayout, SignInScreen } from "@/features/admin";

const LoginRoute = () => (
  <AdminLayout>
    <SignInScreen />
  </AdminLayout>
);

export const Route = createFileRoute("/login")({
  component: LoginRoute,
});
