import { sql } from "drizzle-orm";
import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

import { user } from "./auth";

/**
 * The cloud database each Believer's device syncs with (ADR-0001), created on
 * their first sign-in. One row per Believer; the server never opens it.
 */
export const believerDatabase = sqliteTable("believer_database", {
  userId: text("user_id")
    .primaryKey()
    .references(() => user.id, { onDelete: "cascade" }),
  /** The database's name on the host (Turso Cloud or the local sync server). */
  name: text("name").notNull().unique(),
  /** Where devices sync it. */
  url: text("url").notNull(),
  createdAt: integer("created_at", { mode: "timestamp_ms" })
    .default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
    .notNull(),
});
