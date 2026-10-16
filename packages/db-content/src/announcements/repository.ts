import {
  ANNOUNCEMENT_STATUSES,
  AUDIENCES,
} from "@alrisali/domain/announcements";
import type {
  Announcement,
  AnnouncementDraft,
} from "@alrisali/domain/announcements";
import { and, desc, eq, inArray, isNull, lte, ne } from "drizzle-orm";

import type { ContentDb } from "../shared";
import { announcement } from "./schema";

type Row = typeof announcement.$inferSelect;

const toAnnouncement = (row: Row): Announcement => ({
  id: row.id,
  text: {
    ar: { title: row.titleAr, body: row.bodyAr },
    en: { title: row.titleEn, body: row.bodyEn },
  },
  audience: AUDIENCES.find((audience) => audience === row.audience) ?? "all",
  status:
    ANNOUNCEMENT_STATUSES.find((status) => status === row.status) ?? "draft",
  scheduledAt: row.scheduledAt,
  sentAt: row.sentAt,
  archivedAt: row.archivedAt,
  createdAt: row.createdAt,
  updatedAt: row.updatedAt,
});

const draftColumns = ({ text, audience }: AnnouncementDraft) => ({
  titleAr: text.ar.title,
  bodyAr: text.ar.body,
  titleEn: text.en.title,
  bodyEn: text.en.body,
  audience,
});

const notSent = ne(announcement.status, "sent");

export interface AnnouncementsRepository {
  /** Every Announcement, newest first; archived ones only when asked for. */
  list: (options?: {
    includeArchived?: boolean | undefined;
  }) => Promise<Announcement[]>;
  find: (id: string) => Promise<Announcement | null>;
  /** These Announcements, in no particular order; unknown ids are skipped. */
  findMany: (ids: readonly string[]) => Promise<Announcement[]>;
  /** A new draft. */
  create: (draft: AnnouncementDraft, now: number) => Promise<Announcement>;
  /** Rewrites a draft or scheduled one; null when absent or already sent. */
  update: (
    id: string,
    draft: AnnouncementDraft,
    now: number
  ) => Promise<Announcement | null>;
  /** Sends it at `at`; null when absent or already sent. */
  schedule: (
    id: string,
    at: number,
    now: number
  ) => Promise<Announcement | null>;
  /** Back to a draft; null unless it was scheduled. */
  unschedule: (id: string, now: number) => Promise<Announcement | null>;
  /** Deletes a draft or scheduled one; false when absent or already sent. */
  remove: (id: string) => Promise<boolean>;
  /**
   * Archives a sent one at `now`: off device inboxes and the default list,
   * kept on record. One already archived stays as it was. Null when absent
   * or not sent.
   */
  archive: (id: string, now: number) => Promise<Announcement | null>;
  /**
   * Marks every scheduled Announcement due by `now` as sent and returns them.
   * One statement, so two callers never claim the same Announcement.
   */
  claimDue: (now: number) => Promise<Announcement[]>;
}

/** The server's access to Announcements in the content database. */
export const createAnnouncementsRepository = (
  db: ContentDb
): AnnouncementsRepository => ({
  list: async ({ includeArchived = false } = {}) => {
    const rows = await db
      .select()
      .from(announcement)
      .where(includeArchived ? undefined : isNull(announcement.archivedAt))
      .orderBy(desc(announcement.createdAt));
    return rows.map(toAnnouncement);
  },
  find: async (id) => {
    const [row] = await db
      .select()
      .from(announcement)
      .where(eq(announcement.id, id));
    return row ? toAnnouncement(row) : null;
  },
  findMany: async (ids) => {
    if (ids.length === 0) {
      return [];
    }
    const rows = await db
      .select()
      .from(announcement)
      .where(inArray(announcement.id, [...ids]));
    return rows.map(toAnnouncement);
  },
  create: async (draft, now) => {
    const [row] = await db
      .insert(announcement)
      .values({
        id: crypto.randomUUID(),
        ...draftColumns(draft),
        status: "draft",
        createdAt: now,
        updatedAt: now,
      })
      .returning();
    if (!row) {
      throw new Error("The new Announcement was not stored");
    }
    return toAnnouncement(row);
  },
  update: async (id, draft, now) => {
    const [row] = await db
      .update(announcement)
      .set({ ...draftColumns(draft), updatedAt: now })
      .where(and(eq(announcement.id, id), notSent))
      .returning();
    return row ? toAnnouncement(row) : null;
  },
  schedule: async (id, at, now) => {
    const [row] = await db
      .update(announcement)
      .set({ status: "scheduled", scheduledAt: at, updatedAt: now })
      .where(and(eq(announcement.id, id), notSent))
      .returning();
    return row ? toAnnouncement(row) : null;
  },
  unschedule: async (id, now) => {
    const [row] = await db
      .update(announcement)
      .set({ status: "draft", scheduledAt: null, updatedAt: now })
      .where(and(eq(announcement.id, id), eq(announcement.status, "scheduled")))
      .returning();
    return row ? toAnnouncement(row) : null;
  },
  remove: async (id) => {
    const rows = await db
      .delete(announcement)
      .where(and(eq(announcement.id, id), notSent))
      .returning({ id: announcement.id });
    return rows.length > 0;
  },
  archive: async (id, now) => {
    const [row] = await db
      .update(announcement)
      .set({ archivedAt: now, updatedAt: now })
      .where(
        and(
          eq(announcement.id, id),
          eq(announcement.status, "sent"),
          isNull(announcement.archivedAt)
        )
      )
      .returning();
    if (row) {
      return toAnnouncement(row);
    }
    const [already] = await db
      .select()
      .from(announcement)
      .where(and(eq(announcement.id, id), eq(announcement.status, "sent")));
    return already ? toAnnouncement(already) : null;
  },
  claimDue: async (now) => {
    const rows = await db
      .update(announcement)
      .set({ status: "sent", sentAt: now, updatedAt: now })
      .where(
        and(
          eq(announcement.status, "scheduled"),
          lte(announcement.scheduledAt, now)
        )
      )
      .returning();
    return rows.map(toAnnouncement);
  },
});
