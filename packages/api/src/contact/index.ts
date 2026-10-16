import {
  contactMessageSchema,
  contactMessageStatusSchema,
} from "@alrisali/domain/contact";
import { oc } from "@orpc/contract";
import { z } from "zod";

const receivedMessage = contactMessageSchema.extend({
  id: z.string(),
  status: contactMessageStatusSchema,
  /** Whether a signed-in Believer sent it (else a Guest). */
  fromBeliever: z.boolean(),
  userAgent: z.string().nullable(),
  createdAt: z.date(),
});

export type ReceivedContactMessage = z.infer<typeof receivedMessage>;

export const contactContract = {
  /**
   * Sends the team a Contact Message, signed in or as a Guest. Refused with
   * `TOO_MANY_REQUESTS` once the sender's IP address has sent the
   * `CONTACT_RATE_LIMIT` within its window.
   */
  send: oc.input(contactMessageSchema).output(z.object({ id: z.string() })),
  /** Admins: the inbox, newest first, optionally only one status. */
  inbox: oc
    .input(z.object({ status: contactMessageStatusSchema.optional() }))
    .output(z.object({ messages: z.array(receivedMessage) })),
  /** Admins: how many messages have each status; `new` is the unread count. */
  counts: oc.output(z.record(contactMessageStatusSchema, z.number().int())),
  /**
   * Admins: moves messages to a status. Unknown ids are skipped; `updated`
   * counts the messages it changed.
   */
  setStatus: oc
    .input(
      z.object({
        ids: z.array(z.string()).min(1).max(100),
        status: contactMessageStatusSchema,
      })
    )
    .output(z.object({ updated: z.number().int() })),
};
