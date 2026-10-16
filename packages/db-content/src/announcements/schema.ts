import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

/**
 * Announcements Admins write once in Arabic and English and send to many
 * Believers. Times are epoch milliseconds. Status and audience values come
 * from `@alrisali/domain/announcements`.
 */
export const announcement = sqliteTable("announcement", {
  id: text("id").primaryKey(),
  titleAr: text("title_ar").notNull().default(""),
  bodyAr: text("body_ar").notNull().default(""),
  titleEn: text("title_en").notNull().default(""),
  bodyEn: text("body_en").notNull().default(""),
  audience: text("audience").notNull().default("all"),
  status: text("status").notNull().default("draft"),
  /** When a scheduled Announcement goes out. */
  scheduledAt: integer("scheduled_at"),
  /** When it went out; set once, when the scheduler claims it. */
  sentAt: integer("sent_at"),
  /** When an Admin archived it (sent ones only): off device inboxes and the default list. */
  archivedAt: integer("archived_at"),
  createdAt: integer("created_at").notNull(),
  updatedAt: integer("updated_at").notNull(),
});
