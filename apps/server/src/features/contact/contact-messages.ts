import { createHmac, randomUUID } from "node:crypto";

import type { Database } from "@alrisali/db-server";
import { contactMessage } from "@alrisali/db-server/schema/contact";
import { CONTACT_MESSAGE_STATUSES } from "@alrisali/domain/contact";
import type {
  ContactMessageDraft,
  ContactMessageStatus,
} from "@alrisali/domain/contact";
import { and, count, desc, eq, gt, inArray, sql } from "drizzle-orm";

/** Stored instead of the IP address: the same address gives the same hash. */
export const hashIp = (ip: string | null, key: string): string =>
  createHmac("sha256", key)
    .update(ip ?? "unknown")
    .digest("hex");

/** How many messages this IP hash sent after `since` (epoch ms). */
export const countSentSince = async (
  db: Database,
  ipHash: string,
  since: number
): Promise<number> => {
  const [row] = await db
    .select({ sent: count() })
    .from(contactMessage)
    .where(
      and(
        eq(contactMessage.ipHash, ipHash),
        gt(contactMessage.createdAt, new Date(since))
      )
    );
  return row?.sent ?? 0;
};

export const saveContactMessage = async (
  db: Database,
  draft: ContactMessageDraft,
  sender: {
    userId: string | null;
    ipHash: string;
    userAgent: string | null;
    sentAt: number;
  }
): Promise<string> => {
  const id = randomUUID();
  await db.insert(contactMessage).values({
    id,
    ...draft,
    userId: sender.userId,
    ipHash: sender.ipHash,
    userAgent: sender.userAgent,
    createdAt: new Date(sender.sentAt),
  });
  return id;
};

/** The inbox, newest first (ties in arrival order, newest first too). */
export const listContactMessages = async (
  db: Database,
  status: ContactMessageStatus | undefined
) => {
  const rows = await db
    .select({
      id: contactMessage.id,
      name: contactMessage.name,
      email: contactMessage.email,
      subject: contactMessage.subject,
      message: contactMessage.message,
      status: contactMessage.status,
      userId: contactMessage.userId,
      userAgent: contactMessage.userAgent,
      createdAt: contactMessage.createdAt,
    })
    .from(contactMessage)
    .where(status ? eq(contactMessage.status, status) : undefined)
    .orderBy(desc(contactMessage.createdAt), desc(sql`rowid`));
  return rows.map(({ userId, ...message }) => ({
    ...message,
    fromBeliever: userId !== null,
  }));
};

export const countByStatus = async (
  db: Database
): Promise<Record<ContactMessageStatus, number>> => {
  const rows = await db
    .select({ status: contactMessage.status, messages: count() })
    .from(contactMessage)
    .groupBy(contactMessage.status);
  const counts = Object.fromEntries(
    CONTACT_MESSAGE_STATUSES.map((status) => [status, 0])
  ) as Record<ContactMessageStatus, number>;
  for (const { status, messages } of rows) {
    counts[status] = messages;
  }
  return counts;
};

export const setContactMessageStatus = async (
  db: Database,
  ids: string[],
  status: ContactMessageStatus
): Promise<number> => {
  const result = await db
    .update(contactMessage)
    .set({ status })
    .where(inArray(contactMessage.id, ids));
  return result.rowsAffected;
};
