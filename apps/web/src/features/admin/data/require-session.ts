import { redirect } from "@tanstack/react-router";

import { authClient } from "@/shared/lib/auth-client";

/** Route guard: sends a visitor without a session to the admin sign-in. */
export const requireSession = async () => {
  const { data: session } = await authClient.getSession();
  if (!session) {
    throw redirect({ to: "/admin/login" });
  }
  return { session };
};
