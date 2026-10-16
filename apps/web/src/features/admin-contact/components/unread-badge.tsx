import { useQuery } from "@tanstack/react-query";

import { orpc } from "@/shared/lib/orpc";

/** How many Contact Messages no Admin has opened yet; nothing when none. */
export const UnreadMessagesBadge = () => {
  const counts = useQuery({
    ...orpc.contact.counts.queryOptions(),
    refetchInterval: 60 * 1000,
  });
  const unread = counts.data?.new ?? 0;
  if (unread === 0) {
    return null;
  }
  return (
    <span
      className="bg-primary text-primary-foreground ms-1.5 inline-flex min-w-5 justify-center px-1 text-xs tabular-nums"
      aria-label={`${unread} unread`}
    >
      {unread}
    </span>
  );
};
