import { z } from "zod";

/** The languages an Announcement is written in; each device gets its own. */
export const ANNOUNCEMENT_LANGUAGES = ["ar", "en"] as const;

export type AnnouncementLanguage = (typeof ANNOUNCEMENT_LANGUAGES)[number];

export const announcementLanguageSchema = z.enum(ANNOUNCEMENT_LANGUAGES);

/**
 * Who an Announcement goes to: every device, the devices opened lately
 * (active Believers), or the devices that joined lately (new Believers).
 */
export const AUDIENCES = ["all", "active", "new"] as const;

export type Audience = (typeof AUDIENCES)[number];

export const audienceSchema = z.enum(AUDIENCES);

/**
 * A draft is being written; a scheduled one goes out at `scheduledAt`; a sent
 * one went out at `sentAt` and can no longer change. A sent one can only be
 * archived (`archivedAt`): it leaves device inboxes and the Admins' default
 * list, and stays on record.
 */
export const ANNOUNCEMENT_STATUSES = ["draft", "scheduled", "sent"] as const;

export type AnnouncementStatus = (typeof ANNOUNCEMENT_STATUSES)[number];

export const TITLE_MAX_LENGTH = 120;
export const BODY_MAX_LENGTH = 1000;

/** One language's text. Either may be empty while it is a draft. */
export const announcementTextSchema = z.object({
  title: z.string().trim().max(TITLE_MAX_LENGTH),
  body: z.string().trim().max(BODY_MAX_LENGTH),
});

export type AnnouncementText = z.infer<typeof announcementTextSchema>;

/** What an Admin writes: the text in both languages and the audience. */
export const announcementDraftSchema = z.object({
  text: z.object({ ar: announcementTextSchema, en: announcementTextSchema }),
  audience: audienceSchema,
});

export type AnnouncementDraft = z.infer<typeof announcementDraftSchema>;

/** The text in each language, keyed by language. */
export type BilingualText = Record<AnnouncementLanguage, AnnouncementText>;

/**
 * The languages still missing a title or body. An Announcement is sent (or
 * scheduled) only when none is missing, so every Believer reads it in their
 * own language.
 */
export const missingLanguages = (text: BilingualText): AnnouncementLanguage[] =>
  ANNOUNCEMENT_LANGUAGES.filter(
    (language) =>
      text[language].title.trim() === "" || text[language].body.trim() === ""
  );

export const isPublishable = (text: BilingualText): boolean =>
  missingLanguages(text).length === 0;

/** An Announcement as Admins see it. Times are epoch milliseconds. */
export const announcementSchema = announcementDraftSchema.extend({
  id: z.string().min(1),
  status: z.enum(ANNOUNCEMENT_STATUSES),
  scheduledAt: z.number().int().nullable(),
  sentAt: z.number().int().nullable(),
  /** When an Admin archived it; null while it is not archived. */
  archivedAt: z.number().int().nullable(),
  createdAt: z.number().int(),
  updatedAt: z.number().int(),
});

export type Announcement = z.infer<typeof announcementSchema>;
