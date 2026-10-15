import type { ReceivedContactMessage } from "@alrisali/api/contact";

/**
 * The inbox list with the open message kept in it. Opening a new message
 * marks it read, so the refetch under the "new" filter drops it; the Admin
 * is still reading it, so it stays where it was (the inbox is newest first)
 * until they close it or change the filter. A listed copy wins: it is fresher.
 */
export const keepOpenMessage = (
  messages: ReceivedContactMessage[],
  open: ReceivedContactMessage | null
): ReceivedContactMessage[] => {
  if (!open || messages.some(({ id }) => id === open.id)) {
    return messages;
  }
  const at = messages.findIndex(
    ({ createdAt }) => createdAt.getTime() < open.createdAt.getTime()
  );
  return at === -1
    ? [...messages, open]
    : [...messages.slice(0, at), open, ...messages.slice(at)];
};
