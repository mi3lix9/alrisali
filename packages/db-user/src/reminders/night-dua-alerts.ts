import {
  DEFAULT_NIGHT_DUA_ALERTS,
  nightDuaAlertsChangeSchema,
} from "@alrisali/domain/reminders";
import type {
  NightDuaAlerts,
  NightDuaAlertsChange,
} from "@alrisali/domain/reminders";
import { eq } from "drizzle-orm";

import type { UserDb } from "../shared";
import { nightDuaAlerts } from "./schema";

export interface NightDuaAlertsRepository {
  /** Every toggle; all off until the Believer turns one on. */
  get: () => Promise<NightDuaAlerts>;
  /** Validates and saves the change, then returns the saved toggles. */
  update: (change: NightDuaAlertsChange) => Promise<NightDuaAlerts>;
}

/** One row, with a stable id so sync merges it. */
const ROW_ID = "believer";

/** The toggles a change names (a partial may carry explicit `undefined`s). */
const definedOnly = (change: NightDuaAlertsChange): Partial<NightDuaAlerts> =>
  Object.fromEntries(
    Object.entries(change).filter(([, value]) => value !== undefined)
  );

export const createNightDuaAlertsRepository = (
  db: UserDb
): NightDuaAlertsRepository => {
  const get = async (): Promise<NightDuaAlerts> => {
    const row = await db
      .select()
      .from(nightDuaAlerts)
      .where(eq(nightDuaAlerts.id, ROW_ID))
      .get();
    return row
      ? {
          kumayl: row.kumayl,
          tawassul: row.tawassul,
          nudba: row.nudba,
          ziyarah: row.ziyarah,
        }
      : DEFAULT_NIGHT_DUA_ALERTS;
  };

  return {
    get,
    update: async (change) => {
      const next: NightDuaAlerts = {
        ...(await get()),
        ...definedOnly(nightDuaAlertsChangeSchema.parse(change)),
      };
      await db
        .insert(nightDuaAlerts)
        .values({ id: ROW_ID, ...next })
        .onConflictDoUpdate({ target: nightDuaAlerts.id, set: next });
      return next;
    },
  };
};
