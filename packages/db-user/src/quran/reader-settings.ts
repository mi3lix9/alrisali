import {
  DEFAULT_QURAN_READER_SETTINGS,
  quranReaderSettingsSchema,
} from "@alrisali/domain/quran";
import type { QuranReaderSettings } from "@alrisali/domain/quran";
import { eq } from "drizzle-orm";

import type { UserDb } from "../shared";
import { quranReaderSettings } from "./schema";

/** The settings to change; anything left out keeps its saved value. */
export type QuranReaderSettingsChange = Partial<QuranReaderSettings>;

export interface QuranReaderSettingsRepository {
  get: () => Promise<QuranReaderSettings>;
  /** Validates and saves the change, then returns the saved settings. */
  update: (change: QuranReaderSettingsChange) => Promise<QuranReaderSettings>;
}

/** The table holds one row, with a stable id so sync merges it. */
const ROW_ID = "believer";

type Row = typeof quranReaderSettings.$inferSelect;

/** Reads each column on its own: a newer app may have synced a value this one does not know. */
const toSettings = (row: Row | undefined): QuranReaderSettings => {
  const { shape } = quranReaderSettingsSchema;
  const defaults = DEFAULT_QURAN_READER_SETTINGS;
  return {
    mode: shape.mode.safeParse(row?.mode).data ?? defaults.mode,
    pageNav: shape.pageNav.safeParse(row?.pageNav).data ?? defaults.pageNav,
    surahFontSize:
      shape.surahFontSize.safeParse(row?.surahFontSize).data ??
      defaults.surahFontSize,
  };
};

export const createQuranReaderSettingsRepository = (
  db: UserDb
): QuranReaderSettingsRepository => {
  const get = async (): Promise<QuranReaderSettings> =>
    toSettings(
      await db
        .select()
        .from(quranReaderSettings)
        .where(eq(quranReaderSettings.id, ROW_ID))
        .get()
    );

  const update = async (
    change: QuranReaderSettingsChange
  ): Promise<QuranReaderSettings> => {
    const parsed = quranReaderSettingsSchema.partial().parse(change);
    const current = await get();
    const next: QuranReaderSettings = {
      mode: parsed.mode ?? current.mode,
      pageNav: parsed.pageNav ?? current.pageNav,
      surahFontSize: parsed.surahFontSize ?? current.surahFontSize,
    };
    await db
      .insert(quranReaderSettings)
      .values({ id: ROW_ID, ...next })
      .onConflictDoUpdate({ target: quranReaderSettings.id, set: next });
    return next;
  };

  return { get, update };
};
