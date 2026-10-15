import { index, integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

import { user } from "./auth";

// Usage analytics (ticket 21): our own tables, no third-party platform.
// Times are epoch milliseconds. A Believer's account deletion keeps their
// installs' and events' counts but drops the link to them (`set null`).

/** One row per app installation, updated by every batch it sends. */
export const analyticsInstall = sqliteTable(
  "analytics_install",
  {
    /** Random, made on the device. */
    installId: text("install_id").primaryKey(),
    /** The Believer last signed in on it, if any. */
    userId: text("user_id").references(() => user.id, { onDelete: "set null" }),
    platform: text("platform").notNull(),
    osVersion: text("os_version").notNull(),
    appVersion: text("app_version").notNull(),
    deviceType: text("device_type").notNull(),
    birthYear: integer("birth_year"),
    /** Its earliest event: the start of its retention cohort. */
    firstSeenAt: integer("first_seen_at").notNull(),
    lastSeenAt: integer("last_seen_at").notNull(),
  },
  (table) => [
    index("analytics_install_first_seen_idx").on(table.firstSeenAt),
    index("analytics_install_last_seen_idx").on(table.lastSeenAt),
  ]
);

/** Screen views, feature use and actions, as the devices reported them. */
export const analyticsEvent = sqliteTable(
  "analytics_event",
  {
    /** Made on the device, so a batch retried after a lost reply is kept once. */
    id: text("id").primaryKey(),
    installId: text("install_id")
      .notNull()
      .references(() => analyticsInstall.installId, { onDelete: "cascade" }),
    /** The signed-in Believer who sent it; null for a Guest. */
    userId: text("user_id").references(() => user.id, { onDelete: "set null" }),
    type: text("type").notNull(),
    name: text("name").notNull(),
    data: text("data", { mode: "json" }).$type<
      Record<string, string | number | boolean>
    >(),
    occurredAt: integer("occurred_at").notNull(),
    receivedAt: integer("received_at").notNull(),
  },
  (table) => [
    index("analytics_event_occurred_idx").on(table.occurredAt),
    index("analytics_event_type_idx").on(table.type, table.occurredAt),
    index("analytics_event_install_idx").on(table.installId, table.occurredAt),
  ]
);
