import {
  calculationMethodSchema,
  DEFAULT_CALCULATION_METHOD,
  DEFAULT_HIJRI_ADJUSTMENT,
  hijriAdjustmentSchema,
  locationSchema,
} from "@alrisali/domain/shared";
import type { CalculationMethod, Location } from "@alrisali/domain/shared";
import { eq } from "drizzle-orm";
import { z } from "zod";

import { believerSettings } from "./schema";
import type { UserDb } from "./user-database";

export interface BelieverSettings {
  calculationMethod: CalculationMethod;
  location: Location | null;
  /** The Believer's own Hijri Adjustment, added to the Admins'. */
  hijriAdjustment: number;
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
});

type Row = typeof believerSettings.$inferSelect;

const toSettings = (row: Row | undefined): BelieverSettings => {
  const method = calculationMethodSchema.safeParse(row?.calculationMethod);
  const adjustment = hijriAdjustmentSchema.safeParse(row?.hijriAdjustment);
  const latitude = row?.locationLatitude ?? null;
  const longitude = row?.locationLongitude ?? null;
  return {
    // A newer app may have synced a method this one does not know.
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
  };
};

const toColumns = ({
  calculationMethod,
  location,
  hijriAdjustment,
}: BelieverSettings) => ({
  calculationMethod,
  locationLatitude: location?.latitude ?? null,
  locationLongitude: location?.longitude ?? null,
  locationName: location?.name ?? null,
  hijriAdjustment,
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
