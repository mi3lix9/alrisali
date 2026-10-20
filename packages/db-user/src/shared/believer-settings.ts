import {
  calculationMethodSchema,
  DEFAULT_CALCULATION_METHOD,
  DEFAULT_HIJRI_ADJUSTMENT,
  DEFAULT_MESSAGE_STYLE,
  hijriAdjustmentSchema,
  DEFAULT_IMSAK_MINUTES,
  imsakMinutesSchema,
  locationSchema,
  messageStyleSchema,
  timeFormatSchema,
  customAnglesSchema,
  DEFAULT_CUSTOM_ANGLES,
  DEFAULT_HIGH_LATITUDE_RULE,
  DEFAULT_MIDNIGHT_DEFINITION,
  highLatitudeRuleSchema,
  midnightDefinitionSchema,
  prayerAdjustmentsSchema,
  readPrayerAdjustments,
} from "@alrisali/domain/shared";
import type {
  CalculationMethod,
  CustomAngles,
  HighLatitudeRule,
  Location,
  MessageStyle,
  MidnightDefinition,
  PrayerAdjustments,
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
  /** Classic (scriptural sources) or Modern (gentle coaching). */
  messageStyle: MessageStyle;
  /** The angles of the Custom Calculation Method. */
  customAngles: CustomAngles;
  /** Minutes added to each Prayer Time, −30…30; a time left out is not moved. */
  prayerAdjustments: PrayerAdjustments;
  midnightDefinition: MidnightDefinition;
  highLatitudeRule: HighLatitudeRule;
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
  messageStyle: messageStyleSchema.optional(),
  customAngles: customAnglesSchema.optional(),
  prayerAdjustments: prayerAdjustmentsSchema.optional(),
  midnightDefinition: midnightDefinitionSchema.optional(),
  highLatitudeRule: highLatitudeRuleSchema.optional(),
});

type Row = typeof believerSettings.$inferSelect;

/** A stored value if this app knows it, else the fallback. */
const known = <T>(schema: z.ZodType<T>, stored: unknown, fallback: T): T => {
  const parsed = schema.safeParse(stored);
  return parsed.success ? parsed.data : fallback;
};

/** Custom angles stored as JSON, or the defaults if absent or unreadable. */
const readCustomAngles = (stored: string | null | undefined): CustomAngles => {
  if (!stored) {
    return DEFAULT_CUSTOM_ANGLES;
  }
  try {
    return known(customAnglesSchema, JSON.parse(stored), DEFAULT_CUSTOM_ANGLES);
  } catch {
    return DEFAULT_CUSTOM_ANGLES;
  }
};

/** Prayer adjustments stored as JSON; none if absent or unreadable. */
const readStoredAdjustments = (
  stored: string | null | undefined
): PrayerAdjustments => {
  if (!stored) {
    return {};
  }
  try {
    return readPrayerAdjustments(JSON.parse(stored));
  } catch {
    return {};
  }
};

const toSettings = (row: Row | undefined): BelieverSettings => {
  // A newer app may have synced values this one does not know.
  const latitude = row?.locationLatitude ?? null;
  const longitude = row?.locationLongitude ?? null;
  return {
    calculationMethod: known(
      calculationMethodSchema,
      row?.calculationMethod,
      DEFAULT_CALCULATION_METHOD
    ),
    location:
      latitude === null || longitude === null
        ? null
        : { latitude, longitude, name: row?.locationName ?? null },
    hijriAdjustment: known(
      hijriAdjustmentSchema,
      row?.hijriAdjustment,
      DEFAULT_HIJRI_ADJUSTMENT
    ),
    locationFollowsDevice: row?.locationFollowsDevice ?? true,
    imsakMinutes: known(
      imsakMinutesSchema,
      row?.imsakMinutes,
      DEFAULT_IMSAK_MINUTES
    ),
    timeFormat: known(timeFormatSchema.nullable(), row?.timeFormat, null),
    messageStyle: known(
      messageStyleSchema,
      row?.messageStyle,
      DEFAULT_MESSAGE_STYLE
    ),
    customAngles: readCustomAngles(row?.customAngles),
    prayerAdjustments: readStoredAdjustments(row?.prayerAdjustments),
    midnightDefinition: known(
      midnightDefinitionSchema,
      row?.midnightDefinition,
      DEFAULT_MIDNIGHT_DEFINITION
    ),
    highLatitudeRule: known(
      highLatitudeRuleSchema,
      row?.highLatitudeRule,
      DEFAULT_HIGH_LATITUDE_RULE
    ),
  };
};

const toColumns = ({
  calculationMethod,
  location,
  hijriAdjustment,
  locationFollowsDevice,
  imsakMinutes,
  timeFormat,
  messageStyle,
  customAngles,
  prayerAdjustments,
  midnightDefinition,
  highLatitudeRule,
}: BelieverSettings) => ({
  calculationMethod,
  locationLatitude: location?.latitude ?? null,
  locationLongitude: location?.longitude ?? null,
  locationName: location?.name ?? null,
  hijriAdjustment,
  locationFollowsDevice,
  imsakMinutes,
  timeFormat,
  messageStyle,
  customAngles: JSON.stringify(customAngles),
  prayerAdjustments: JSON.stringify(prayerAdjustments),
  midnightDefinition,
  highLatitudeRule,
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
      messageStyle: parsed.messageStyle ?? current.messageStyle,
      customAngles: parsed.customAngles ?? current.customAngles,
      prayerAdjustments:
        parsed.prayerAdjustments === undefined
          ? current.prayerAdjustments
          : readPrayerAdjustments(parsed.prayerAdjustments),
      midnightDefinition:
        parsed.midnightDefinition ?? current.midnightDefinition,
      highLatitudeRule: parsed.highLatitudeRule ?? current.highLatitudeRule,
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
