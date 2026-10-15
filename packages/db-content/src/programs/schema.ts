import { index, integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

// Installed apps read these tables, so changes stay additive (new columns
// nullable or defaulted). Variable parts (an Act's schedule and type detail)
// are JSON validated by `@alrisali/domain/programs` on read, so a newer kind
// of Act is skipped by an older app instead of breaking it.

/** Official Programs, in the Admins' order. */
export const programs = sqliteTable("programs", {
  id: text("id").primaryKey(),
  /** `general` or `seasonal`. */
  category: text("category").notNull(),
  nameAr: text("name_ar").notNull(),
  nameEn: text("name_en").notNull(),
  descriptionAr: text("description_ar").notNull().default(""),
  descriptionEn: text("description_en").notNull().default(""),
  /** A Seasonal Program's Hijri window as month/day pairs; null for General. */
  windowStartMonth: integer("window_start_month"),
  windowStartDay: integer("window_start_day"),
  windowEndMonth: integer("window_end_month"),
  windowEndDay: integer("window_end_day"),
  active: integer("active", { mode: "boolean" }).notNull().default(true),
  position: integer("position").notNull(),
});

/** A Program's Acts, in the Admins' order. */
export const programActs = sqliteTable(
  "program_acts",
  {
    id: text("id").primaryKey(),
    programId: text("program_id").notNull(),
    position: integer("position").notNull(),
    nameAr: text("name_ar").notNull(),
    nameEn: text("name_en").notNull(),
    descriptionAr: text("description_ar").notNull().default(""),
    descriptionEn: text("description_en").notNull().default(""),
    /** `ActSchedule` JSON. */
    schedule: text("schedule").notNull(),
    /** `ActSalah` JSON, or null for a general Act. */
    salah: text("salah"),
    /** `ActDetail` JSON (regular, dua or prayer). */
    detail: text("detail").notNull(),
  },
  (table) => [index("program_acts_program_idx").on(table.programId)]
);
