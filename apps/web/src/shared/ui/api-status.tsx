import { useQuery } from "@tanstack/react-query";

import { orpc } from "@/shared/lib/orpc";

/** Whether the oRPC server answers its health check. */
export const ApiStatus = () => {
  const healthCheck = useQuery(orpc.healthCheck.queryOptions());

  let statusLabel = "Disconnected";
  if (healthCheck.isLoading) {
    statusLabel = "Checking...";
  } else if (healthCheck.data) {
    statusLabel = "Connected";
  }

  return (
    <section className="rounded-lg border p-4">
      <h2 className="mb-2 font-medium">API Status</h2>
      <div className="flex items-center gap-2">
        <div
          className={`h-2 w-2 rounded-full ${healthCheck.data ? "bg-green-500" : "bg-red-500"}`}
        />
        <span className="text-muted-foreground text-sm">{statusLabel}</span>
      </div>
    </section>
  );
};
