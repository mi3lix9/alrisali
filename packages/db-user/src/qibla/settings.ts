import {
  DEFAULT_QIBLA_TARGET,
  qiblaTargetSchema,
} from "@alrisali/domain/qibla";
import type { QiblaTarget } from "@alrisali/domain/qibla";
import { eq } from "drizzle-orm";

import type { UserDb } from "../shared";
import { qiblaSettings } from "./schema";

export interface QiblaSettings {
  /** What the compass points at: the Kaaba (default) or a Shrine. */
  target: QiblaTarget;
}

export interface QiblaSettingsRepository {
  settings: () => Promise<QiblaSettings>;
  /** Validates and saves the change, then returns the saved settings. */
  update: (change: Partial<QiblaSettings>) => Promise<QiblaSettings>;
}

/** One row, with a stable id so sync merges it. */
const ROW_ID = "believer";

export const createQiblaSettingsRepository = (
  db: UserDb
): QiblaSettingsRepository => {
  const settings = async (): Promise<QiblaSettings> => {
    const row = await db
      .select()
      .from(qiblaSettings)
      .where(eq(qiblaSettings.id, ROW_ID))
      .get();
    // A target synced from a newer app reads as the Kaaba.
    const target = qiblaTargetSchema.safeParse(row?.target);
    return { target: target.success ? target.data : DEFAULT_QIBLA_TARGET };
  };

  const update = async (
    change: Partial<QiblaSettings>
  ): Promise<QiblaSettings> => {
    const current = await settings();
    const next: QiblaSettings = {
      target: change.target
        ? qiblaTargetSchema.parse(change.target)
        : current.target,
    };
    await db
      .insert(qiblaSettings)
      .values({ id: ROW_ID, ...next })
      .onConflictDoUpdate({ target: qiblaSettings.id, set: next });
    return next;
  };

  return { settings, update };
};
