import {
  applyReminderSettingsChange,
  readImsakRule,
  readQuietHours,
  readSalahRules,
} from "@alrisali/domain/reminders";
import type {
  ReminderSettings,
  ReminderSettingsChange,
} from "@alrisali/domain/reminders";
import { eq } from "drizzle-orm";

import type { UserDb } from "../shared";
import { reminderSettings } from "./schema";

export interface ReminderSettingsRepository {
  get: () => Promise<ReminderSettings>;
  /** Validates and saves the change, then returns the saved settings. */
  update: (change: ReminderSettingsChange) => Promise<ReminderSettings>;
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

/**
 * Updates are read-modify-write of one row, so two running at once would each
 * read the same row and the later write would undo the earlier change. Each
 * database runs its updates one at a time, however many repositories wrap it.
 */
const updateQueues = new WeakMap<UserDb, Promise<unknown>>();

export const createReminderSettingsRepository = (
  db: UserDb
): ReminderSettingsRepository => {
  const get = async (): Promise<ReminderSettings> => {
    const row = await db
      .select()
      .from(reminderSettings)
      .where(eq(reminderSettings.id, ROW_ID))
      .get();
    return {
      salah: readSalahRules(parseJson(row?.salahRules)),
      imsak: readImsakRule(parseJson(row?.imsakRule)),
      quietHours: readQuietHours({
        enabled: row?.quietHoursEnabled,
        start: row?.quietHoursStart,
        end: row?.quietHoursEnd,
      }),
    };
  };

  const update = (
    change: ReminderSettingsChange
  ): Promise<ReminderSettings> => {
    const run = async (): Promise<ReminderSettings> => {
      // A failed update must not block the ones queued behind it.
      await (updateQueues.get(db) ?? Promise.resolve()).catch(() => null);
      const next = applyReminderSettingsChange(await get(), change);
      const columns = {
        salahRules: JSON.stringify(next.salah),
        imsakRule: JSON.stringify(next.imsak),
        quietHoursEnabled: next.quietHours.enabled,
        quietHoursStart: next.quietHours.start,
        quietHoursEnd: next.quietHours.end,
      };
      await db
        .insert(reminderSettings)
        .values({ id: ROW_ID, ...columns })
        .onConflictDoUpdate({ target: reminderSettings.id, set: columns });
      return next;
    };
    const result = run();
    updateQueues.set(db, result);
    return result;
  };

  return { get, update };
};
