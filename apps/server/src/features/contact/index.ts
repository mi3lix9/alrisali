import { CONTACT_RATE_LIMIT } from "@alrisali/domain/contact";
import { ORPCError } from "@orpc/server";

import { admin, os } from "@/shared/lib/orpc";

import {
  countByStatus,
  countSentSince,
  hashIp,
  listContactMessages,
  saveContactMessage,
  setContactMessageStatus,
} from "./contact-messages";

export { clientIpOf } from "./client-ip";

/**
 * Open to Guests. The IP address is kept only as a keyed hash; once it has
 * sent `CONTACT_RATE_LIMIT.messages` in the last window, it waits. Two
 * simultaneous requests may both pass the check: the limit is abuse
 * protection, not an exact quota.
 */
const send = os.contact.send.handler(async ({ context, input }) => {
  const { db, client, ipHashKey, session } = context;
  const now = Date.now();
  const ipHash = hashIp(client.ip, ipHashKey);
  const sent = await countSentSince(
    db,
    ipHash,
    now - CONTACT_RATE_LIMIT.windowMs
  );
  if (sent >= CONTACT_RATE_LIMIT.messages) {
    throw new ORPCError("TOO_MANY_REQUESTS");
  }
  const id = await saveContactMessage(db, input, {
    userId: session?.user.id ?? null,
    ipHash,
    userAgent: client.userAgent,
    sentAt: now,
  });
  return { id };
});

const inbox = admin.contact.inbox.handler(
  async ({ context, input: { status } }) => ({
    messages: await listContactMessages(context.db, status),
  })
);

const counts = admin.contact.counts.handler(({ context }) =>
  countByStatus(context.db)
);

const setStatus = admin.contact.setStatus.handler(
  async ({ context, input: { ids, status } }) => ({
    updated: await setContactMessageStatus(context.db, ids, status),
  })
);

export const contactRouter = { send, inbox, counts, setStatus };
