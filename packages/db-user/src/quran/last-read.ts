import { findAyah } from "@alrisali/domain/quran";
import type { AyahKey } from "@alrisali/domain/quran";
import { eq } from "drizzle-orm";

import type { UserDb } from "../shared";
import { quranLastRead } from "./schema";

export interface QuranLastRead {
  ayah: AyahKey;
  /** ISO instant it was set; across devices the latest wins. */
  setAt: string;
}

export interface QuranLastReadRepository {
  /** The Last-Read Ayah, or null before the Believer has read. */
  get: () => Promise<QuranLastRead | null>;
  /** Saves the ayah (`surah:ayah`) as the Last-Read Ayah. */
  set: (ayah: AyahKey) => Promise<QuranLastRead>;
}

/** The table holds one row, with a stable id so sync merges it. */
const ROW_ID = "believer";

export const createQuranLastReadRepository = (
  db: UserDb,
  now: () => Date = () => new Date()
): QuranLastReadRepository => {
  const get = async (): Promise<QuranLastRead | null> => {
    const row = await db
      .select()
      .from(quranLastRead)
      .where(eq(quranLastRead.id, ROW_ID))
      .get();
    // A newer mushaf may have synced an ayah this one does not have.
    const ayah = row ? findAyah(row.ayah) : undefined;
    return row && ayah ? { ayah: ayah.key, setAt: row.setAt } : null;
  };

  const set = async (ayah: AyahKey): Promise<QuranLastRead> => {
    const found = findAyah(ayah);
    if (!found) {
      throw new Error(`No ayah ${ayah} in the mushaf`);
    }
    const next = { ayah: found.key, setAt: now().toISOString() };
    await db
      .insert(quranLastRead)
      .values({ id: ROW_ID, ...next })
      .onConflictDoUpdate({ target: quranLastRead.id, set: next });
    return next;
  };

  return { get, set };
};
