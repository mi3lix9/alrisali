import { redirect } from "@tanstack/react-router";

import { authClient } from "@/shared/lib/auth-client";

/** Route guard: sends a visitor without a session to /login. */
export const requireSession = async () => {
  const session = await authClient.getSession();
  if (!session.data) {
    throw redirect({
      to: "/login",
    });
  }
  return { session };
};
