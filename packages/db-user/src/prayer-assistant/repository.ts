import {
  bowSensitivitySchema,
  customPaceSchema,
  DEFAULT_PRAYER_ASSISTANT_SETTINGS,
  paceSchema,
  prayerAssistantSettingsSchema,
  recognitionModeSchema,
} from "@alrisali/domain/prayer-assistant";
import type { PrayerAssistantSettings } from "@alrisali/domain/prayer-assistant";
import { eq } from "drizzle-orm";
import type { z } from "zod";

import type { UserDb } from "../shared";
import { prayerAssistantSettings } from "./schema";

export interface PrayerAssistantRepository {
  settings: () => Promise<PrayerAssistantSettings>;
  /** Validates and saves the change, then returns the saved settings. */
  update: (
    change: Partial<PrayerAssistantSettings>
  ) => Promise<PrayerAssistantSettings>;
}

/** One row, with a stable id so sync merges it. */
const ROW_ID = "believer";

const DEFAULTS = DEFAULT_PRAYER_ASSISTANT_SETTINGS;

/** A stored value if this app knows it, else the fallback. */
const known = <T>(schema: z.ZodType<T>, stored: unknown, fallback: T): T => {
  const parsed = schema.safeParse(stored);
  return parsed.success ? parsed.data : fallback;
};

const changeSchema = prayerAssistantSettingsSchema.partial();

export const createPrayerAssistantRepository = (
  db: UserDb
): PrayerAssistantRepository => {
  const settings = async (): Promise<PrayerAssistantSettings> => {
    const row = await db
      .select()
      .from(prayerAssistantSettings)
      .where(eq(prayerAssistantSettings.id, ROW_ID))
      .get();
    return {
      pace: known(paceSchema, row?.pace, DEFAULTS.pace),
      custom: known(
        customPaceSchema,
        { holdMs: row?.holdMs, tashahhudMs: row?.tashahhudMs },
        DEFAULTS.custom
      ),
      bowSensitivity: known(
        bowSensitivitySchema,
        row?.bowSensitivity,
        DEFAULTS.bowSensitivity
      ),
      recognitionMode: known(
        recognitionModeSchema,
        row?.recognitionMode,
        DEFAULTS.recognitionMode
      ),
    };
  };

  const update = async (
    change: Partial<PrayerAssistantSettings>
  ): Promise<PrayerAssistantSettings> => {
    const parsed = changeSchema.parse(change);
    const current = await settings();
    const next: PrayerAssistantSettings = {
      pace: parsed.pace ?? current.pace,
      custom: parsed.custom ?? current.custom,
      bowSensitivity: parsed.bowSensitivity ?? current.bowSensitivity,
      recognitionMode: parsed.recognitionMode ?? current.recognitionMode,
    };
    const columns = {
      pace: next.pace,
      holdMs: next.custom.holdMs,
      tashahhudMs: next.custom.tashahhudMs,
      bowSensitivity: next.bowSensitivity,
      recognitionMode: next.recognitionMode,
    };
    await db
      .insert(prayerAssistantSettings)
      .values({ id: ROW_ID, ...columns })
      .onConflictDoUpdate({ target: prayerAssistantSettings.id, set: columns });
    return next;
  };

  return { settings, update };
};
