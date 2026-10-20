import { cleanNoteText, findAyah, sortNotes } from "@alrisali/domain/quran";
import type { AyahKey, AyahNote } from "@alrisali/domain/quran";
import { eq } from "drizzle-orm";

import type { UserDb } from "../shared";
import { quranAyahNotes } from "./schema";

export interface QuranAyahNotesRepository {
  /** Every note in mushaf order. */
  list: () => Promise<AyahNote[]>;
  /**
   * Writes the ayah's note, replacing the one it had; blank text deletes it.
   */
  write: (ayah: AyahKey, text: string) => Promise<void>;
  /** Deletes the ayah's note. */
  remove: (ayah: AyahKey) => Promise<void>;
}

export const createQuranAyahNotesRepository = (
  db: UserDb,
  now: () => Date = () => new Date()
): QuranAyahNotesRepository => {
  const list = async (): Promise<AyahNote[]> => {
    const rows = await db.select().from(quranAyahNotes).all();
    return sortNotes(
      rows.map((row) => ({
        ayah: row.ayah as AyahKey,
        text: row.text,
        updatedAt: row.updatedAt,
      }))
    );
  };

  const remove = async (ayah: AyahKey) => {
    await db.delete(quranAyahNotes).where(eq(quranAyahNotes.ayah, ayah));
  };

  const write = async (ayah: AyahKey, text: string) => {
    const found = findAyah(ayah);
    if (!found) {
      throw new Error(`No ayah ${ayah} in the mushaf`);
    }
    const clean = cleanNoteText(text);
    if (clean === "") {
      await remove(found.key);
      return;
    }
    const updatedAt = now().toISOString();
    await db
      .insert(quranAyahNotes)
      .values({ ayah: found.key, text: clean, updatedAt })
      .onConflictDoUpdate({
        target: quranAyahNotes.ayah,
        set: { text: clean, updatedAt },
      });
  };

  return { list, write, remove };
};
