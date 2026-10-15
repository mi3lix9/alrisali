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
});
