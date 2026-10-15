import { z } from "zod";

/** Length limits of each field, the same on the form and the server. */
export const CONTACT_MESSAGE_LIMITS = {
  name: { min: 2, max: 100 },
  email: { max: 255 },
  subject: { min: 3, max: 120 },
  message: { min: 10, max: 3000 },
} as const;

const { name, email, subject, message } = CONTACT_MESSAGE_LIMITS;

/** What a Believer (or a Guest) writes in a Contact Message. */
export const contactMessageSchema = z.object({
  name: z.string().trim().min(name.min).max(name.max),
  email: z.string().trim().max(email.max).pipe(z.email()),
  subject: z.string().trim().min(subject.min).max(subject.max),
  message: z.string().trim().min(message.min).max(message.max),
});

export type ContactMessageInput = z.input<typeof contactMessageSchema>;
export type ContactMessageDraft = z.output<typeof contactMessageSchema>;

/** The field a draft fails on first, so a form can point at it. */
export type ContactMessageField = keyof ContactMessageDraft;

/** Where an Admin has got to with a Contact Message. New until opened. */
export const CONTACT_MESSAGE_STATUSES = [
  "new",
  "read",
  "replied",
  "archived",
] as const;
export const contactMessageStatusSchema = z.enum(CONTACT_MESSAGE_STATUSES);
export type ContactMessageStatus = z.infer<typeof contactMessageStatusSchema>;

/**
 * Abuse protection: at most this many Contact Messages from one IP address
 * (kept only as a hash) in any rolling window of this length.
 */
export const CONTACT_RATE_LIMIT = {
  messages: 3,
  windowMs: 60 * 60 * 1000,
} as const;
