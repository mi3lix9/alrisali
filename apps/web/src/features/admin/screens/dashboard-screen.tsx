import { useQuery } from "@tanstack/react-query";

import type { authClient } from "@/shared/lib/auth-client";
import { orpc } from "@/shared/lib/orpc";

type Session = Awaited<ReturnType<typeof authClient.getSession>>;

export const DashboardScreen = ({ session }: { session: Session }) => {
  const privateData = useQuery(orpc.account.privateData.queryOptions());

  return (
    <div>
      <h1>Dashboard</h1>
      <p>Welcome {session.data?.user.name}</p>
      <p>API: {privateData.data?.message}</p>
    </div>
  );
};
