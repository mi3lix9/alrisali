import { sql } from "drizzle-orm";
import { index, integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

import { user } from "./auth";

/**
 * Contact Messages Believers and Guests send the Al-Risali team. Admins read
 * them in the inbox and move each through new → read → replied → archived.
 */
export const contactMessage = sqliteTable(
  "contact_message",
  {
    id: text("id").primaryKey(),
    /** The sender when signed in; null for a Guest. Gone with their account. */
    userId: text("user_id").references(() => user.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    email: text("email").notNull(),
    subject: text("subject").notNull(),
    message: text("message").notNull(),
    /** Keyed hash of the sender's IP address, only for rate limiting. */
    ipHash: text("ip_hash").notNull(),
    userAgent: text("user_agent"),
    status: text("status", {
      enum: ["new", "read", "replied", "archived"],
    })
      .default("new")
      .notNull(),
    createdAt: integer("created_at", { mode: "timestamp_ms" })
      .default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
      .notNull(),
  },
  (table) => [
    index("contact_message_ip_hash_created_at_idx").on(
      table.ipHash,
      table.createdAt
    ),
    index("contact_message_status_idx").on(table.status),
    index("contact_message_created_at_idx").on(table.createdAt),
  ]
);
