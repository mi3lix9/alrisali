import {
  cleanRibbonName,
  findAyah,
  isRibbonColor,
  normaliseRibbons,
} from "@alrisali/domain/quran";
import type {
  AyahKey,
  BookmarkRibbon,
  RibbonColor,
} from "@alrisali/domain/quran";

import type { UserDb } from "../shared";
import { quranBookmarkRibbons } from "./schema";

export interface QuranRibbonsRepository {
  /** Exactly six ribbons in colour order, unused ones included. */
  list: () => Promise<BookmarkRibbon[]>;
  /** Puts the colour's ribbon on the ayah, taking it off wherever it was. */
  move: (color: RibbonColor, ayah: AyahKey) => Promise<void>;
  /** Takes the ribbon off its ayah; it keeps its name. */
  clear: (color: RibbonColor) => Promise<void>;
  /** Names the ribbon; a blank name restores the colour's default. */
  rename: (color: RibbonColor, name: string) => Promise<void>;
}

export const createQuranRibbonsRepository = (
  db: UserDb,
  now: () => Date = () => new Date()
): QuranRibbonsRepository => {
  const list = async (): Promise<BookmarkRibbon[]> => {
    const rows = await db.select().from(quranBookmarkRibbons).all();
    return normaliseRibbons(
      rows.flatMap((row) =>
        isRibbonColor(row.color)
          ? [
              {
                color: row.color,
                name: row.name,
                ayah: row.ayah as AyahKey | null,
                updatedAt: row.updatedAt,
              },
            ]
          : []
      )
    );
  };

  const write = async (
    color: RibbonColor,
    change: Partial<Pick<BookmarkRibbon, "ayah" | "name">>
  ) => {
    const updatedAt = now().toISOString();
    await db
      .insert(quranBookmarkRibbons)
      .values({ color, ...change, updatedAt })
      .onConflictDoUpdate({
        target: quranBookmarkRibbons.color,
        set: { ...change, updatedAt },
      });
  };

  const move = async (color: RibbonColor, ayah: AyahKey) => {
    const found = findAyah(ayah);
    if (!found) {
      throw new Error(`No ayah ${ayah} in the mushaf`);
    }
    await write(color, { ayah: found.key });
  };

  const clear = (color: RibbonColor) => write(color, { ayah: null });

  const rename = (color: RibbonColor, name: string) =>
    write(color, { name: cleanRibbonName(name) });

  return { list, move, clear, rename };
};
