import {
  DEFAULT_TASBIH_SETTINGS,
  tasbihFeedbackModeSchema,
  tasbihSettingsSchema,
} from "@alrisali/domain/tasbih";
import type { TasbihSettings } from "@alrisali/domain/tasbih";
import { eq } from "drizzle-orm";

import type { UserDb } from "../shared";
import { tasbihSettings } from "./schema";

export interface TasbihSettingsRepository {
  settings: () => Promise<TasbihSettings>;
  /** Validates and saves the change, then returns the saved settings. */
  update: (change: Partial<TasbihSettings>) => Promise<TasbihSettings>;
}

/** One row, with a stable id so sync merges it. */
const ROW_ID = "believer";

const changeSchema = tasbihSettingsSchema.partial();

export const createTasbihSettingsRepository = (
  db: UserDb
): TasbihSettingsRepository => {
  const settings = async (): Promise<TasbihSettings> => {
    const row = await db
      .select()
      .from(tasbihSettings)
      .where(eq(tasbihSettings.id, ROW_ID))
      .get();
    // A mode synced from a newer app reads as the default.
    const feedbackMode = tasbihFeedbackModeSchema.safeParse(row?.feedbackMode);
    return {
      feedbackMode: feedbackMode.success
        ? feedbackMode.data
        : DEFAULT_TASBIH_SETTINGS.feedbackMode,
    };
  };

  const update = async (
    change: Partial<TasbihSettings>
  ): Promise<TasbihSettings> => {
    const parsed = changeSchema.parse(change);
    const current = await settings();
    const next: TasbihSettings = {
      feedbackMode: parsed.feedbackMode ?? current.feedbackMode,
    };
    await db
      .insert(tasbihSettings)
      .values({ id: ROW_ID, ...next })
      .onConflictDoUpdate({ target: tasbihSettings.id, set: next });
    return next;
  };

  return { settings, update };
};
