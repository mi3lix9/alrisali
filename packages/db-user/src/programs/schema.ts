import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

/**
 * The Believer's Subscriptions. The id is the Program's id, so subscribing on
 * two devices makes one Subscription when they sync.
 */
export const programSubscriptions = sqliteTable("program_subscriptions", {
  id: text("id").primaryKey(),
  /** `general`, `seasonal` or `personal`: what the limits count. */
  programKind: text("program_kind").notNull(),
  paused: integer("paused", { mode: "boolean" }).notNull().default(false),
  /** Milliseconds since the epoch. */
  subscribedAt: integer("subscribed_at").notNull(),
});
