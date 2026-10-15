import { DEFAULT_HIJRI_ADJUSTMENT } from "@alrisali/domain/shared";
import { eq } from "drizzle-orm";

import { isMissingTable } from "./content-db";
import type { ContentDb } from "./content-db";
import { globalSettings } from "./schema";

const GLOBAL_ID = "global";

export interface GlobalSettingsRepository {
  /**
   * The Admins' Hijri Adjustment; the default (0) until one is published or
   * while the device's replica has never pulled.
   */
  hijriAdjustment: () => Promise<number>;
  /** Publishes a new Hijri Adjustment (the server only; replicas refuse). */
  setHijriAdjustment: (adjustment: number) => Promise<void>;
}

export const createGlobalSettingsRepository = (
  db: ContentDb
): GlobalSettingsRepository => ({
  hijriAdjustment: async () => {
    try {
      const [row] = await db
        .select({ hijriAdjustment: globalSettings.hijriAdjustment })
        .from(globalSettings)
        .where(eq(globalSettings.id, GLOBAL_ID));
      return row?.hijriAdjustment ?? DEFAULT_HIJRI_ADJUSTMENT;
    } catch (error) {
      if (isMissingTable(error)) {
        return DEFAULT_HIJRI_ADJUSTMENT;
      }
      throw error;
    }
  },
  setHijriAdjustment: async (adjustment) => {
    await db
      .insert(globalSettings)
      .values({ id: GLOBAL_ID, hijriAdjustment: adjustment })
      .onConflictDoUpdate({
        target: globalSettings.id,
        set: { hijriAdjustment: adjustment },
      });
  },
});
