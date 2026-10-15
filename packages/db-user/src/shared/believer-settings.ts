import {
  calculationMethodSchema,
  DEFAULT_CALCULATION_METHOD,
  DEFAULT_HIJRI_ADJUSTMENT,
  hijriAdjustmentSchema,
  DEFAULT_IMSAK_MINUTES,
  imsakMinutesSchema,
  locationSchema,
  timeFormatSchema,
} from "@alrisali/domain/shared";
import type {
  CalculationMethod,
  Location,
  TimeFormat,
} from "@alrisali/domain/shared";
import { eq } from "drizzle-orm";
import { z } from "zod";

import { believerSettings } from "./schema";
import type { UserDb } from "./user-database";

export interface BelieverSettings {
  calculationMethod: CalculationMethod;
  location: Location | null;
  /** The Believer's own Hijri Adjustment, added to the Admins'. */
  hijriAdjustment: number;
  /** Whether the location follows the device's GPS, or was chosen by hand. */
  locationFollowsDevice: boolean;
  /** How many minutes before Fajr Imsak falls. */
  imsakMinutes: number;
  /** 12- or 24-hour times; null follows the device's clock setting. */
  timeFormat: TimeFormat | null;
}

/** The settings to change; anything left out keeps its saved value. */
export type BelieverSettingsChange = Partial<BelieverSettings>;

export interface BelieverSettingsRepository {
  get: () => Promise<BelieverSettings>;
  /** Validates and saves the change, then returns the saved settings. */
  update: (change: BelieverSettingsChange) => Promise<BelieverSettings>;
}

/** The settings table holds one row, with a stable id so sync merges it. */
const ROW_ID = "believer";

const changeSchema = z.object({
  calculationMethod: calculationMethodSchema.optional(),
  location: locationSchema.nullable().optional(),
  hijriAdjustment: hijriAdjustmentSchema.optional(),
  locationFollowsDevice: z.boolean().optional(),
  imsakMinutes: imsakMinutesSchema.optional(),
  timeFormat: timeFormatSchema.nullable().optional(),
});

type Row = typeof believerSettings.$inferSelect;

const toSettings = (row: Row | undefined): BelieverSettings => {
  // A newer app may have synced values this one does not know.
  const method = calculationMethodSchema.safeParse(row?.calculationMethod);
  const adjustment = hijriAdjustmentSchema.safeParse(row?.hijriAdjustment);
  const imsakMinutes = imsakMinutesSchema.safeParse(row?.imsakMinutes);
  const timeFormat = timeFormatSchema.safeParse(row?.timeFormat);
  const latitude = row?.locationLatitude ?? null;
  const longitude = row?.locationLongitude ?? null;
  return {
    calculationMethod: method.success
      ? method.data
      : DEFAULT_CALCULATION_METHOD,
    location:
      latitude === null || longitude === null
        ? null
        : { latitude, longitude, name: row?.locationName ?? null },
    hijriAdjustment: adjustment.success
      ? adjustment.data
      : DEFAULT_HIJRI_ADJUSTMENT,
    locationFollowsDevice: row?.locationFollowsDevice ?? true,
    imsakMinutes: imsakMinutes.success
      ? imsakMinutes.data
      : DEFAULT_IMSAK_MINUTES,
    timeFormat: timeFormat.success ? timeFormat.data : null,
  };
};

const toColumns = ({
  calculationMethod,
  location,
  hijriAdjustment,
  locationFollowsDevice,
  imsakMinutes,
  timeFormat,
}: BelieverSettings) => ({
  calculationMethod,
  locationLatitude: location?.latitude ?? null,
  locationLongitude: location?.longitude ?? null,
  locationName: location?.name ?? null,
  hijriAdjustment,
  locationFollowsDevice,
  imsakMinutes,
  timeFormat,
});

export const createBelieverSettingsRepository = (
  db: UserDb
): BelieverSettingsRepository => {
  const get = async (): Promise<BelieverSettings> =>
    toSettings(
      await db
        .select()
        .from(believerSettings)
        .where(eq(believerSettings.id, ROW_ID))
        .get()
    );

  const update = async (
    change: BelieverSettingsChange
  ): Promise<BelieverSettings> => {
    const parsed = changeSchema.parse(change);
    const current = await get();
    const next: BelieverSettings = {
      calculationMethod: parsed.calculationMethod ?? current.calculationMethod,
      location:
        parsed.location === undefined ? current.location : parsed.location,
      hijriAdjustment: parsed.hijriAdjustment ?? current.hijriAdjustment,
      locationFollowsDevice:
        parsed.locationFollowsDevice ?? current.locationFollowsDevice,
      imsakMinutes: parsed.imsakMinutes ?? current.imsakMinutes,
      timeFormat:
        parsed.timeFormat === undefined
          ? current.timeFormat
          : parsed.timeFormat,
    };
    const columns = toColumns(next);
    await db
      .insert(believerSettings)
      .values({ id: ROW_ID, ...columns })
      .onConflictDoUpdate({ target: believerSettings.id, set: columns });
    return next;
  };

  return { get, update };
};
