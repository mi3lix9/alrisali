import {
  applyOccasionAlertSettingsChange,
  readOccasionAlertSettings,
} from "@alrisali/domain/reminders";
import type {
  OccasionAlertSettings,
  OccasionAlertSettingsChange,
} from "@alrisali/domain/reminders";
import { eq } from "drizzle-orm";

import type { UserDb } from "../shared";
import { occasionAlertSettings } from "./schema";

export interface OccasionAlertSettingsRepository {
  get: () => Promise<OccasionAlertSettings>;
  /** Validates and saves the change, then returns the saved settings. */
  update: (
    change: OccasionAlertSettingsChange
  ) => Promise<OccasionAlertSettings>;
}

/** One row, with a stable id so sync merges it. */
const ROW_ID = "believer";

const parseJson = (stored: string | null | undefined): unknown => {
  if (stored === null || stored === undefined) {
    return null;
  }
  try {
    return JSON.parse(stored);
  } catch {
    return null;
  }
};

export const createOccasionAlertSettingsRepository = (
  db: UserDb
): OccasionAlertSettingsRepository => {
  const get = async (): Promise<OccasionAlertSettings> => {
    const row = await db
      .select()
      .from(occasionAlertSettings)
      .where(eq(occasionAlertSettings.id, ROW_ID))
      .get();
    return readOccasionAlertSettings({
      enabled: row?.enabled,
      timing: row?.timing,
      time: row?.time,
      types: parseJson(row?.types),
    });
  };

  const update = async (
    change: OccasionAlertSettingsChange
  ): Promise<OccasionAlertSettings> => {
    const next = applyOccasionAlertSettingsChange(await get(), change);
    const columns = {
      enabled: next.enabled,
      timing: next.timing,
      time: next.time,
      types: JSON.stringify(next.types),
    };
    await db
      .insert(occasionAlertSettings)
      .values({ id: ROW_ID, ...columns })
      .onConflictDoUpdate({ target: occasionAlertSettings.id, set: columns });
    return next;
  };

  return { get, update };
};
