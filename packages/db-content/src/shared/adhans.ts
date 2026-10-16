import { adhanCatalogueEntrySchema } from "@alrisali/domain/shared";
import type { AdhanCatalogueEntry } from "@alrisali/domain/shared";
import { asc, eq, max } from "drizzle-orm";

import { isMissingTable } from "./content-db";
import type { ContentDb } from "./content-db";
import { adhans } from "./schema";

type AdhanRow = typeof adhans.$inferSelect;

export interface AdhansRepository {
  /**
   * The catalogue in the Admins' order; empty while a device's replica has
   * never pulled. A row this version cannot read is left out, not fatal.
   */
  list: () => Promise<AdhanCatalogueEntry[]>;
  /** Creates or rewrites a voice (the server only; replicas refuse). A new one goes last. */
  save: (entry: AdhanCatalogueEntry) => Promise<void>;
  /** Withdraws a voice; nothing happens for an unknown id. */
  remove: (id: string) => Promise<void>;
  /** Puts the voices in the order of `ids` (the Admins send every one). */
  reorder: (ids: readonly string[]) => Promise<void>;
}

const toEntry = (row: AdhanRow): AdhanCatalogueEntry | null => {
  const parsed = adhanCatalogueEntrySchema.safeParse({
    id: row.id,
    name: { ar: row.nameAr, en: row.nameEn },
    credit: row.credit,
    full: { key: row.fullKey, seconds: row.fullSeconds, bytes: row.fullBytes },
    takbir: {
      key: row.takbirKey,
      seconds: row.takbirSeconds,
      bytes: row.takbirBytes,
    },
  });
  return parsed.success ? parsed.data : null;
};

const toValues = (entry: AdhanCatalogueEntry) => ({
  nameAr: entry.name.ar,
  nameEn: entry.name.en,
  credit: entry.credit,
  fullKey: entry.full.key,
  fullSeconds: entry.full.seconds,
  fullBytes: entry.full.bytes,
  takbirKey: entry.takbir.key,
  takbirSeconds: entry.takbir.seconds,
  takbirBytes: entry.takbir.bytes,
});

export const createAdhansRepository = (db: ContentDb): AdhansRepository => {
  const rows = () =>
    db.select().from(adhans).orderBy(asc(adhans.position), asc(adhans.id));
  return {
    list: async () => {
      try {
        const found = await rows();
        return found.flatMap((row) => {
          const entry = toEntry(row);
          return entry ? [entry] : [];
        });
      } catch (error) {
        if (isMissingTable(error)) {
          return [];
        }
        throw error;
      }
    },
    save: async (entry) => {
      const [last] = await db
        .select({ position: max(adhans.position) })
        .from(adhans);
      const values = toValues(entry);
      await db
        .insert(adhans)
        .values({
          id: entry.id,
          position: (last?.position ?? -1) + 1,
          ...values,
        })
        .onConflictDoUpdate({ target: adhans.id, set: values });
    },
    remove: async (id) => {
      await db.delete(adhans).where(eq(adhans.id, id));
    },
    reorder: async (ids) => {
      const [first, ...rest] = ids.map((id, position) =>
        db.update(adhans).set({ position }).where(eq(adhans.id, id))
      );
      if (first) {
        await db.batch([first, ...rest]);
      }
    },
  };
};
