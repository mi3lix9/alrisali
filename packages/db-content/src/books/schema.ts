import {
  integer,
  primaryKey,
  sqliteTable,
  text,
} from "drizzle-orm/sqlite-core";

/**
 * The A'mal index: the acts Books point to on a Hijri day or month (day 0 is
 * the whole month). It refers to the bundled Books by stable Supplication id
 * only. Seeded from the index the app bundled, so a device that has not pulled
 * yet shows the same.
 */
export const amalEntries = sqliteTable(
  "amal_entries",
  {
    /** The Hijri month, 1 (Muharram) to 12 (Dhu al-Hijja). */
    month: integer("month").notNull(),
    /** The day of the month, 1 to 30; 0 means every day of the month. */
    day: integer("day").notNull(),
    /** One of the content package's `AMAL_KINDS`. */
    kind: text("kind").notNull(),
    /** `night` (the eve that begins the day), `day`, or empty for either. */
    time: text("time").notNull().default(""),
    supplicationId: text("supplication_id").notNull(),
  },
  (table) => [
    primaryKey({
      columns: [table.month, table.day, table.time, table.supplicationId],
    }),
  ]
);
