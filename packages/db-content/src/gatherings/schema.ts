import {
  index,
  integer,
  real,
  sqliteTable,
  text,
} from "drizzle-orm/sqlite-core";

/** The Speakers Admins publish; Gatherings refer to them by id. */
export const speakers = sqliteTable("speakers", {
  id: text("id").primaryKey(),
  nameAr: text("name_ar").notNull(),
  nameEn: text("name_en").notNull().default(""),
  /** Where the photo is in the files bucket; devices load it from the server. */
  photoKey: text("photo_key"),
});

/**
 * Gatherings, active or not: devices show only the active ones. Dates are
 * Gregorian `YYYY-MM-DD`, times the venue's local `HH:MM`.
 */
export const gatherings = sqliteTable(
  "gatherings",
  {
    id: text("id").primaryKey(),
    titleAr: text("title_ar").notNull(),
    titleEn: text("title_en").notNull().default(""),
    descriptionAr: text("description_ar").notNull().default(""),
    descriptionEn: text("description_en").notNull().default(""),
    type: text("type").notNull(),
    date: text("date").notNull(),
    startTime: text("start_time").notNull(),
    endTime: text("end_time"),
    venueNameAr: text("venue_name_ar").notNull(),
    venueNameEn: text("venue_name_en").notNull().default(""),
    venueAddress: text("venue_address").notNull().default(""),
    latitude: real("latitude").notNull(),
    longitude: real("longitude").notNull(),
    speakerId: text("speaker_id"),
    livestreamUrl: text("livestream_url"),
    attendance: text("attendance").notNull(),
    active: integer("active", { mode: "boolean" }).notNull().default(true),
  },
  (table) => [
    index("gatherings_date").on(table.date),
    index("gatherings_speaker").on(table.speakerId),
  ]
);
