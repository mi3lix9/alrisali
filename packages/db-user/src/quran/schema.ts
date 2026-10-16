import { DEFAULT_QURAN_READER_SETTINGS } from "@alrisali/domain/quran";
import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

/** How the Believer reads the Quran, one row. */
export const quranReaderSettings = sqliteTable("quran_reader_settings", {
  id: text("id").primaryKey(),
  mode: text("mode").notNull().default(DEFAULT_QURAN_READER_SETTINGS.mode),
  pageNav: text("page_nav")
    .notNull()
    .default(DEFAULT_QURAN_READER_SETTINGS.pageNav),
  surahFontSize: integer("surah_font_size")
    .notNull()
    .default(DEFAULT_QURAN_READER_SETTINGS.surahFontSize),
  /**
   * Unused: the numeric recitation id older apps kept. Left in place
   * so the migration stays additive; `reciter` replaced it.
   */
  reciterId: integer("reciter_id").notNull().default(7),
  /** The bundled reciter's key, e.g. `ar.alafasy`. */
  reciter: text("reciter")
    .notNull()
    .default(DEFAULT_QURAN_READER_SETTINGS.reciter),
  /** The colour of the page: white, cream, soft-dark or black. */
  pagePalette: text("page_palette")
    .notNull()
    .default(DEFAULT_QURAN_READER_SETTINGS.pagePalette),
  /** Whether the reader keeps the screen awake (0 or 1). */
  keepAwake: integer("keep_awake", { mode: "boolean" })
    .notNull()
    .default(DEFAULT_QURAN_READER_SETTINGS.keepAwake),
});

/**
 * Where the Believer stopped reading, one row: the Last-Read Ayah as
 * `surah:ayah`, shared by Page Mode and Surah Mode.
 */
export const quranLastRead = sqliteTable("quran_last_read", {
  id: text("id").primaryKey(),
  ayah: text("ayah").notNull(),
  /** ISO instant. */
  setAt: text("set_at").notNull(),
});

/**
 * The six Bookmark Ribbons, one row per colour (the primary key keeps it at
 * six). A ribbon is unused while `ayah` is null; a colour with no row is
 * unused too, so nothing is seeded.
 */
export const quranBookmarkRibbons = sqliteTable("quran_bookmark_ribbons", {
  color: text("color").primaryKey(),
  /** The Believer's own name; null shows the colour's default name. */
  name: text("name"),
  /** `surah:ayah` the ribbon rests on; null while unused. */
  ayah: text("ayah"),
  /** ISO instant it was last moved or renamed; across devices the row last written wins. */
  updatedAt: text("updated_at"),
});

/**
 * The Believer's last ten Quran searches, one row per query (the primary key
 * keeps a repeat to one row; the newest `searchedAt` sorts first).
 */
export const quranSearchHistory = sqliteTable("quran_search_history", {
  query: text("query").primaryKey(),
  /** ISO instant of the latest time it was searched. */
  searchedAt: text("searched_at").notNull(),
});
