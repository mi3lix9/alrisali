import { isAdmin } from "@alrisali/auth/roles";
import { useNavigate } from "@tanstack/react-router";
import type { ReactNode } from "react";

import { authClient } from "@/shared/lib/auth-client";
import type { Session } from "@/shared/lib/auth-client";
import { Button } from "@/shared/ui/button";

/**
 * Shows the admin pages only to an Admin. The server refuses every admin
 * procedure to anyone else anyway; this just says so instead of failing.
 */
export const AdminGate = ({
  session,
  children,
}: {
  session: Session;
  children: ReactNode;
}) => {
  const navigate = useNavigate();

  if (isAdmin(session.user)) {
    return children;
  }

  return (
    <main className="mx-auto mt-16 flex w-full max-w-md flex-col gap-4 p-6 text-center">
      <h1 className="text-2xl font-semibold">Not an Admin</h1>
      <p className="text-muted-foreground">
        {session.user.email} is signed in but does not have the Admin role. Ask
        an Admin to grant it, then sign in again.
      </p>
      <Button
        variant="outline"
        onClick={async () => {
          await authClient.signOut();
          await navigate({ to: "/admin/login" });
        }}
      >
        Sign out
      </Button>
    </main>
  );
};
