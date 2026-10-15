import {
  distractionSchema,
  MAX_KHUSHU_LEVEL,
  MIN_KHUSHU_LEVEL,
  rateKhushu,
} from "@alrisali/domain/khushu";
import type { Distraction, Khushu } from "@alrisali/domain/khushu";
import { SALAH, salahSchema } from "@alrisali/domain/shared";
import type { Salah } from "@alrisali/domain/shared";
import { asc, eq, inArray } from "drizzle-orm";
import { Temporal } from "temporal-polyfill";

import type { UserDb } from "../shared";
import { khushu } from "./schema";

export interface SaveKhushu extends Khushu {
  /** The Believer's local date; a later `date` is refused. */
  today: Temporal.PlainDate;
  /** When the rating was made. */
  at: Date;
}

export interface KhushuRepository {
  /** Every Khushu rating, by date then the day's Salah order. */
  entries: () => Promise<Khushu[]>;
  /**
   * Rates (or re-rates) one Salah and returns the Khushu as kept. Throws
   * `InvalidKhushuError` for a date after `today` or an invalid rating,
   * saving nothing.
   */
  save: (rating: SaveKhushu) => Promise<Khushu>;
  /** Removes one Salah's Khushu; nothing happens if it was not rated. */
  remove: (key: { date: Temporal.PlainDate; salah: Salah }) => Promise<void>;
}

const readDistractions = (stored: string): Distraction[] => {
  let parsed: unknown;
  try {
    parsed = JSON.parse(stored);
  } catch {
    return [];
  }
  if (!Array.isArray(parsed)) {
    return [];
  }
  // A newer app may have synced a Distraction this one does not list.
  return parsed.flatMap((name) => {
    const distraction = distractionSchema.safeParse(name);
    return distraction.success ? [distraction.data] : [];
  });
};

export const createKhushuRepository = (db: UserDb): KhushuRepository => ({
  entries: async () => {
    // A newer app may have synced a Salah name this one does not know.
    const rows = await db
      .select()
      .from(khushu)
      .where(inArray(khushu.salah, SALAH))
      .orderBy(asc(khushu.date))
      .all();
    return rows
      .flatMap((row): Khushu[] => {
        const salah = salahSchema.safeParse(row.salah);
        if (
          !salah.success ||
          !Number.isInteger(row.level) ||
          row.level < MIN_KHUSHU_LEVEL ||
          row.level > MAX_KHUSHU_LEVEL
        ) {
          return [];
        }
        return [
          {
            date: Temporal.PlainDate.from(row.date),
            salah: salah.data,
            level: row.level,
            distractions: readDistractions(row.distractions),
            customDistraction: row.customDistraction,
          },
        ];
      })
      .toSorted(
        (first, second) =>
          Temporal.PlainDate.compare(first.date, second.date) ||
          SALAH.indexOf(first.salah) - SALAH.indexOf(second.salah)
      );
  },
  save: async ({ today, at, ...rating }) => {
    const kept = rateKhushu(rating, today);
    const columns = {
      level: kept.level,
      distractions: JSON.stringify(kept.distractions),
      customDistraction: kept.customDistraction,
      ratedAt: at,
    };
    await db
      .insert(khushu)
      .values({
        id: `${kept.date.toString()}:${kept.salah}`,
        date: kept.date.toString(),
        salah: kept.salah,
        ...columns,
      })
      .onConflictDoUpdate({ target: khushu.id, set: columns });
    return kept;
  },
  remove: async ({ date, salah }) => {
    await db
      .delete(khushu)
      .where(eq(khushu.id, `${date.toString()}:${salahSchema.parse(salah)}`));
  },
});
