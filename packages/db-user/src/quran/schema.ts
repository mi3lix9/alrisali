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
  reciterId: integer("reciter_id")
    .notNull()
    .default(DEFAULT_QURAN_READER_SETTINGS.reciterId),
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
