import { sql } from "drizzle-orm";
import {
  index,
  integer,
  primaryKey,
  sqliteTable,
  text,
} from "drizzle-orm/sqlite-core";

import { user } from "./auth";

const now = sql`(cast(unixepoch('subsecond') * 1000 as integer))`;

/**
 * A device that can receive Announcements through Expo Push, registered by
 * the app on every launch. Guests' devices too: `userId` is set while a
 * Believer is signed in on it.
 */
export const pushDevice = sqliteTable(
  "push_device",
  {
    id: text("id").primaryKey(),
    /** The Expo push token (`ExponentPushToken[...]`). */
    token: text("token").notNull().unique(),
    userId: text("user_id").references(() => user.id, {
      onDelete: "set null",
    }),
    platform: text("platform").notNull(),
    /** The app's language on this device: Announcements arrive in it. */
    language: text("language").notNull(),
    /** False once the Believer turned Announcements off on this device. */
    enabled: integer("enabled", { mode: "boolean" }).notNull().default(true),
    createdAt: integer("created_at", { mode: "timestamp_ms" })
      .default(now)
      .notNull(),
    /** The last check-in: what "active Believers" are measured by. */
    lastSeenAt: integer("last_seen_at", { mode: "timestamp_ms" })
      .default(now)
      .notNull(),
  },
  (table) => [index("push_device_user_id_idx").on(table.userId)]
);

/**
 * An Announcement (content database id) sent to a device: the device's
 * inbox. `ticketId` is Expo's receipt id until the receipt is checked.
 */
export const announcementDelivery = sqliteTable(
  "announcement_delivery",
  {
    announcementId: text("announcement_id").notNull(),
    deviceId: text("device_id")
      .notNull()
      .references(() => pushDevice.id, { onDelete: "cascade" }),
    /** The language it was sent in. */
    language: text("language").notNull(),
    sentAt: integer("sent_at", { mode: "timestamp_ms" }).notNull(),
    ticketId: text("ticket_id"),
  },
  (table) => [
    primaryKey({ columns: [table.announcementId, table.deviceId] }),
    index("announcement_delivery_device_id_idx").on(table.deviceId),
    index("announcement_delivery_ticket_id_idx").on(table.ticketId),
  ]
);
