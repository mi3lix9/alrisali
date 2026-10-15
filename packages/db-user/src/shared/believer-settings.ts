import {
  calculationMethodSchema,
  DEFAULT_CALCULATION_METHOD,
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
});

type Row = typeof believerSettings.$inferSelect;

const toSettings = (row: Row | undefined): BelieverSettings => {
  const method = calculationMethodSchema.safeParse(row?.calculationMethod);
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
  };
};

const toColumns = ({ calculationMethod, location }: BelieverSettings) => ({
  calculationMethod,
  locationLatitude: location?.latitude ?? null,
  locationLongitude: location?.longitude ?? null,
  locationName: location?.name ?? null,
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
