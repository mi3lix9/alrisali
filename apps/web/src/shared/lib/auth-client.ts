import { adminClient } from "better-auth/client/plugins";
import { createAuthClient } from "better-auth/react";

import { ENV } from "@/env";

export const authClient = createAuthClient({
  baseURL: ENV.VITE_SERVER_URL,
  // Types the admin plugin's `role` on the session's user.
  plugins: [adminClient()],
});

/** A signed-in session, with the user's role. */
export type Session = typeof authClient.$Infer.Session;
