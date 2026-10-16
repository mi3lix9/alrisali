import { occasionSchema } from "@alrisali/domain/shared";
import type { Occasion } from "@alrisali/domain/shared";
import { asc, eq } from "drizzle-orm";

import { isMissingTable } from "./content-db";
import type { ContentDb } from "./content-db";
import { occasions } from "./schema";

export interface OccasionsRepository {
  /**
   * The Admins' Occasions in calendar order (month, day, then oldest first);
   * none while the device's replica has never pulled. A row this version
   * cannot read (a type added later) is left out, not fatal.
   */
  list: () => Promise<Occasion[]>;
  /** Publishes a new Occasion (the server only; replicas refuse). */
  create: (occasion: Occasion, createdAt: number) => Promise<Occasion>;
  /** Rewrites an Occasion; null when no Occasion has its id. */
  update: (occasion: Occasion) => Promise<Occasion | null>;
  /** Withdraws an Occasion; false when there was none with that id. */
  remove: (id: string) => Promise<boolean>;
}

export const createOccasionsRepository = (
  db: ContentDb
): OccasionsRepository => {
  const exists = async (id: string) => {
    const [row] = await db
      .select({ id: occasions.id })
      .from(occasions)
      .where(eq(occasions.id, id));
    return row !== undefined;
  };

  return {
    list: async () => {
      try {
        const rows = await db
          .select()
          .from(occasions)
          .orderBy(
            asc(occasions.month),
            asc(occasions.day),
            asc(occasions.createdAt),
            asc(occasions.id)
          );
        // The schema drops `createdAt`, which only orders the rows.
        return rows.flatMap(({ nameAr, nameEn, ...row }) => {
          const parsed = occasionSchema.safeParse({
            ...row,
            name: { ar: nameAr, en: nameEn },
          });
          return parsed.success ? [parsed.data] : [];
        });
      } catch (error) {
        if (isMissingTable(error)) {
          return [];
        }
        throw error;
      }
    },
    create: async ({ name, ...occasion }, createdAt) => {
      await db
        .insert(occasions)
        .values({ ...occasion, nameAr: name.ar, nameEn: name.en, createdAt });
      return { ...occasion, name };
    },
    update: async ({ id, name, ...details }) => {
      if (!(await exists(id))) {
        return null;
      }
      await db
        .update(occasions)
        .set({ ...details, nameAr: name.ar, nameEn: name.en })
        .where(eq(occasions.id, id));
      return { id, ...details, name };
    },
    remove: async (id) => {
      if (!(await exists(id))) {
        return false;
      }
      await db.delete(occasions).where(eq(occasions.id, id));
      return true;
    },
  };
};
