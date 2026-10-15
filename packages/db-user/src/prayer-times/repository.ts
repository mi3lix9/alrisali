import {
  prayerTimeNameSchema,
  readHiddenPrayerTimes,
  setPrayerTimeVisible,
} from "@alrisali/domain/shared";
import type { PrayerTimeName } from "@alrisali/domain/shared";
import { eq } from "drizzle-orm";

import type { UserDb } from "../shared";
import { prayerTimesSettings } from "./schema";

export interface PrayerTimesRepository {
  /** The Hidden Prayer Times, in the day's order. */
  hiddenPrayerTimes: () => Promise<PrayerTimeName[]>;
  /** Shows or hides one Prayer Time and returns the Hidden Prayer Times. */
  setVisible: (
    name: PrayerTimeName,
    visible: boolean
  ) => Promise<PrayerTimeName[]>;
}

/** One row, with a stable id so sync merges it. */
const ROW_ID = "believer";

const parseStored = (stored: string | null | undefined): unknown => {
  if (stored === null || stored === undefined) {
    return null;
  }
  try {
    return JSON.parse(stored);
  } catch {
    return null;
  }
};

export const createPrayerTimesRepository = (
  db: UserDb
): PrayerTimesRepository => {
  const hiddenPrayerTimes = async (): Promise<PrayerTimeName[]> => {
    const row = await db
      .select()
      .from(prayerTimesSettings)
      .where(eq(prayerTimesSettings.id, ROW_ID))
      .get();
    return readHiddenPrayerTimes(parseStored(row?.hiddenPrayerTimes));
  };

  const setVisible = async (
    name: PrayerTimeName,
    visible: boolean
  ): Promise<PrayerTimeName[]> => {
    const hidden = setPrayerTimeVisible(
      await hiddenPrayerTimes(),
      prayerTimeNameSchema.parse(name),
      visible
    );
    const columns = { hiddenPrayerTimes: JSON.stringify(hidden) };
    await db
      .insert(prayerTimesSettings)
      .values({ id: ROW_ID, ...columns })
      .onConflictDoUpdate({ target: prayerTimesSettings.id, set: columns });
    return hidden;
  };

  return { hiddenPrayerTimes, setVisible };
};
