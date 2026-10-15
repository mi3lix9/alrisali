import type { ReceivedContactMessage } from "@alrisali/api/contact";
import { CONTACT_MESSAGE_STATUSES } from "@alrisali/domain/contact";
import type { ContactMessageStatus } from "@alrisali/domain/contact";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";

import { orpc } from "@/shared/lib/orpc";
import { Button, buttonVariants } from "@/shared/ui/button";
import Loader from "@/shared/ui/loader";

import { keepOpenMessage } from "../utils/open-message";

const STATUS_LABELS: Record<ContactMessageStatus, string> = {
  new: "New",
  read: "Read",
  replied: "Replied",
  archived: "Archived",
};

type Filter = ContactMessageStatus | "all";

const sentAt = new Intl.DateTimeFormat("en-GB", {
  dateStyle: "medium",
  timeStyle: "short",
});

const replyLink = ({ email, subject }: ReceivedContactMessage) =>
  `mailto:${email}?subject=${encodeURIComponent(`Re: ${subject}`)}`;

/** Changes messages' status and refreshes the inbox and its counts. */
const useSetStatus = () => {
  const queryClient = useQueryClient();
  return useMutation(
    orpc.contact.setStatus.mutationOptions({
      onSuccess: () =>
        queryClient.invalidateQueries({ queryKey: orpc.contact.key() }),
      onError: (error) => {
        toast.error(error.message);
      },
    })
  );
};

const MessageCard = ({
  message,
  open,
  onToggle: toggle,
  onMove: move,
}: {
  message: ReceivedContactMessage;
  open: boolean;
  onToggle: () => void;
  onMove: (status: ContactMessageStatus) => void;
}) => (
  <li className="border">
    <button
      type="button"
      aria-expanded={open}
      onClick={toggle}
      className="hover:bg-muted flex w-full flex-col gap-1 p-4 text-start transition-colors"
    >
      <span className="flex items-baseline justify-between gap-4">
        <span
          className={message.status === "new" ? "font-semibold" : "font-medium"}
        >
          {message.subject}
        </span>
        <span className="text-muted-foreground shrink-0 text-xs">
          {sentAt.format(message.createdAt)}
        </span>
      </span>
      <span className="text-muted-foreground text-sm">
        {message.name} &lt;{message.email}&gt; ·{" "}
        {message.fromBeliever ? "Signed-in Believer" : "Guest"} ·{" "}
        {STATUS_LABELS[message.status]}
      </span>
    </button>
    {open ? (
      <div className="flex flex-col gap-4 border-t p-4">
        <p className="text-sm whitespace-pre-wrap" dir="auto">
          {message.message}
        </p>
        {message.userAgent ? (
          <p className="text-muted-foreground text-xs">{message.userAgent}</p>
        ) : null}
        <div className="flex flex-wrap gap-2">
          <a
            href={replyLink(message)}
            className={buttonVariants({ size: "sm" })}
            onClick={() => move("replied")}
          >
            Reply by email
          </a>
          {message.status === "replied" ? null : (
            <Button size="sm" variant="outline" onClick={() => move("replied")}>
              Mark replied
            </Button>
          )}
          {message.status === "new" ? null : (
            <Button size="sm" variant="outline" onClick={() => move("new")}>
              Mark unread
            </Button>
          )}
          {message.status === "archived" ? (
            <Button size="sm" variant="outline" onClick={() => move("read")}>
              Unarchive
            </Button>
          ) : (
            <Button
              size="sm"
              variant="outline"
              onClick={() => move("archived")}
            >
              Archive
            </Button>
          )}
        </div>
      </div>
    ) : null}
  </li>
);

/** Admins read Contact Messages and move them through their statuses. */
export const InboxScreen = () => {
  const [filter, setFilter] = useState<Filter>("new");
  // Held apart from the filtered list: a message moved out of the filter
  // (opening a new one reads it) stays open until the Admin closes it.
  const [openMessage, setOpenMessage] = useState<ReceivedContactMessage | null>(
    null
  );
  const counts = useQuery(orpc.contact.counts.queryOptions());
  const inbox = useQuery(
    orpc.contact.inbox.queryOptions({
      input: filter === "all" ? {} : { status: filter },
    })
  );
  const setStatus = useSetStatus();

  const move = (
    message: ReceivedContactMessage,
    status: ContactMessageStatus
  ) => {
    setStatus.mutate({ ids: [message.id], status });
    setOpenMessage((open) =>
      open?.id === message.id ? { ...message, status } : open
    );
  };
  const toggle = (message: ReceivedContactMessage) => {
    if (openMessage?.id === message.id) {
      setOpenMessage(null);
      return;
    }
    setOpenMessage(message);
    // Opening a new message is reading it.
    if (message.status === "new") {
      move(message, "read");
    }
  };

  const total = counts.data
    ? Object.values(counts.data).reduce((sum, count) => sum + count, 0)
    : undefined;
  // The procedure takes up to 100 ids a call; a larger backlog takes a few.
  const newIds =
    filter === "new"
      ? (inbox.data?.messages.slice(0, 100).map(({ id }) => id) ?? [])
      : [];

  return (
    <main className="mx-auto flex w-full max-w-3xl flex-col gap-6 p-6">
      <div>
        <h1 className="text-2xl font-semibold">Messages</h1>
        <p className="text-muted-foreground">
          Contact Messages from Believers and Guests. Opening a new message
          marks it read.
        </p>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2">
        <div role="tablist" className="flex flex-wrap gap-2">
          {[...CONTACT_MESSAGE_STATUSES, "all" as const].map((status) => (
            <Button
              key={status}
              role="tab"
              size="sm"
              aria-selected={filter === status}
              variant={filter === status ? "default" : "outline"}
              onClick={() => {
                setFilter(status);
                setOpenMessage(null);
              }}
            >
              {status === "all" ? "All" : STATUS_LABELS[status]}
              <span className="tabular-nums opacity-70">
                {status === "all" ? total : counts.data?.[status]}
              </span>
            </Button>
          ))}
        </div>
        {newIds.length > 0 ? (
          <Button
            size="sm"
            variant="ghost"
            disabled={setStatus.isPending}
            onClick={() => setStatus.mutate({ ids: newIds, status: "read" })}
          >
            Mark all read
          </Button>
        ) : null}
      </div>

      {inbox.isPending ? <Loader /> : null}
      {inbox.isError ? (
        <p className="text-destructive">
          Could not load the messages: {inbox.error.message}
        </p>
      ) : null}
      {inbox.data?.messages.length === 0 && !openMessage ? (
        <p className="text-muted-foreground">No messages here.</p>
      ) : null}
      {inbox.data ? (
        <ul className="flex flex-col gap-3">
          {keepOpenMessage(inbox.data.messages, openMessage).map((message) => (
            <MessageCard
              key={message.id}
              message={message}
              open={openMessage?.id === message.id}
              onToggle={() => toggle(message)}
              onMove={(status) => move(message, status)}
            />
          ))}
        </ul>
      ) : null}
    </main>
  );
};
