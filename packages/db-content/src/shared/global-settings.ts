import {
  DEFAULT_ADMIN_HIJRI_ADJUSTMENT,
  DEFAULT_HIJRI_ADJUSTMENT,
  forcedHijriDateSchema,
} from "@alrisali/domain/shared";
import type {
  AdminHijriAdjustment,
  ForcedHijriDate,
} from "@alrisali/domain/shared";
import { eq } from "drizzle-orm";

import { isMissingColumn, isMissingTable } from "./content-db";
import type { ContentDb } from "./content-db";
import { globalSettings } from "./schema";

const GLOBAL_ID = "global";

export interface GlobalSettingsRepository {
  /**
   * The Admins' Hijri Adjustment; the default (offset 0, no forced date)
   * until one is published or while the device's replica has never pulled.
   */
  hijriAdjustment: () => Promise<AdminHijriAdjustment>;
  /** Publishes a new Hijri Adjustment (the server only; replicas refuse). */
  setHijriAdjustment: (adjustment: AdminHijriAdjustment) => Promise<void>;
}

/** The stored forced date, or null when none is (or it is incomplete). */
const readForced = (row: {
  forcedHijriYear: number | null;
  forcedHijriMonth: number | null;
  forcedHijriDay: number | null;
  forcedHijriFrom: string | null;
  forcedHijriUntil: string | null;
}): ForcedHijriDate | null => {
  const parsed = forcedHijriDateSchema.safeParse({
    date: {
      year: row.forcedHijriYear,
      month: row.forcedHijriMonth,
      day: row.forcedHijriDay,
    },
    from: row.forcedHijriFrom,
    until: row.forcedHijriUntil,
  });
  return parsed.success ? parsed.data : null;
};

const readOffsetOnly = async (db: ContentDb): Promise<AdminHijriAdjustment> => {
  const [row] = await db
    .select({ hijriAdjustment: globalSettings.hijriAdjustment })
    .from(globalSettings)
    .where(eq(globalSettings.id, GLOBAL_ID));
  return {
    offset: row?.hijriAdjustment ?? DEFAULT_HIJRI_ADJUSTMENT,
    forced: null,
  };
};

export const createGlobalSettingsRepository = (
  db: ContentDb
): GlobalSettingsRepository => ({
  hijriAdjustment: async () => {
    try {
      const [row] = await db
        .select()
        .from(globalSettings)
        .where(eq(globalSettings.id, GLOBAL_ID));
      return row
        ? { offset: row.hijriAdjustment, forced: readForced(row) }
        : DEFAULT_ADMIN_HIJRI_ADJUSTMENT;
    } catch (error) {
      if (isMissingTable(error)) {
        return DEFAULT_ADMIN_HIJRI_ADJUSTMENT;
      }
      // A replica last pulled before forced dates existed has the offset only.
      if (isMissingColumn(error)) {
        return readOffsetOnly(db);
      }
      throw error;
    }
  },
  setHijriAdjustment: async ({ offset, forced }) => {
    const columns = {
      hijriAdjustment: offset,
      forcedHijriYear: forced?.date.year ?? null,
      forcedHijriMonth: forced?.date.month ?? null,
      forcedHijriDay: forced?.date.day ?? null,
      forcedHijriFrom: forced?.from ?? null,
      forcedHijriUntil: forced?.until ?? null,
    };
    await db
      .insert(globalSettings)
      .values({ id: GLOBAL_ID, ...columns })
      .onConflictDoUpdate({ target: globalSettings.id, set: columns });
  },
});
