import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

/**
 * The Believer's Prayer Assistant choices, one row. Columns are nullable:
 * null reads as the default, so a new choice needs no backfill.
 */
export const prayerAssistantSettings = sqliteTable(
  "prayer_assistant_settings",
  {
    id: text("id").primaryKey(),
    /** slow | normal | fast | custom. */
    pace: text("pace"),
    /** Custom Pace: how long a sensed Position holds before it counts. */
    holdMs: integer("hold_ms"),
    /** Custom Pace: how long a sitting holds before it counts as Tashahhud. */
    tashahhudMs: integer("tashahhud_ms"),
    /** 0 (deep bow) to 100 (shallow bow counts as Ruku). */
    bowSensitivity: integer("bow_sensitivity"),
  }
);
