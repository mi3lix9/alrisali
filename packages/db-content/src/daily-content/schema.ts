import { primaryKey, sqliteTable, text } from "drizzle-orm/sqlite-core";

/**
 * The Daily Content map: the Supplication Home features on each weekday. A
 * weekday without a row features nothing. Supplications live in the bundled
 * Books; this table refers to them only by their stable id.
 */
export const dailyContent = sqliteTable("daily_content", {
  /** `saturday` … `friday` (domain `WEEKDAYS`). */
  weekday: text("weekday").primaryKey(),
  supplicationId: text("supplication_id").notNull(),
});

/**
 * The worship mapping beyond the weekday dua: the Supplications Home shows as
 * a weekday's ziyarah, a weekday's night dua, or every day. A weekday may list
 * several. Refers to the bundled Books by stable id only.
 */
export const worshipMapping = sqliteTable(
  "worship_mapping",
  {
    /** One of the domain's `WORSHIP_KINDS`. */
    kind: text("kind").notNull(),
    /** `saturday` … `friday`, or `every` for an every-day item. */
    day: text("day").notNull(),
    supplicationId: text("supplication_id").notNull(),
  },
  (table) => [
    primaryKey({ columns: [table.kind, table.day, table.supplicationId] }),
  ]
);
