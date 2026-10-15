import { MAX_KHUSHU_LEVEL, MIN_KHUSHU_LEVEL } from "@alrisali/domain/khushu";
import { SALAH, salahSchema } from "@alrisali/domain/shared";
import type { KhushuRating } from "@alrisali/domain/shared";
import { sql } from "drizzle-orm";
import { Temporal } from "temporal-polyfill";

import type { InsightsSourceReader } from "../shared";

/** Insights keep every stored Distraction name, even one this app does not list. */
const readStoredDistractions = (stored: string): string[] => {
  try {
    const parsed: unknown = JSON.parse(stored);
    return Array.isArray(parsed)
      ? parsed.filter((name): name is string => typeof name === "string")
      : [];
  } catch {
    return [];
  }
};

/** Khushu as Insights read it: by date, then the day's Salah order. */
export const readKhushuInsightsSource: InsightsSourceReader<
  KhushuRating
> = async (db) => {
  const rows = await db.values<[string, string, number, string, string | null]>(
    sql`SELECT date, salah, level, distractions, custom_distraction
        FROM khushu ORDER BY date`
  );
  return rows
    .flatMap(([day, storedSalah, level, distractions, customDistraction]) => {
      const salah = salahSchema.safeParse(storedSalah);
      if (
        !salah.success ||
        !Number.isInteger(level) ||
        level < MIN_KHUSHU_LEVEL ||
        level > MAX_KHUSHU_LEVEL
      ) {
        return [];
      }
      return [
        {
          date: Temporal.PlainDate.from(day),
          salah: salah.data,
          level,
          distractions: readStoredDistractions(distractions),
          customDistraction,
        },
      ];
    })
    .toSorted(
      (first, second) =>
        Temporal.PlainDate.compare(first.date, second.date) ||
        SALAH.indexOf(first.salah) - SALAH.indexOf(second.salah)
    );
};
