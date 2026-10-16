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
