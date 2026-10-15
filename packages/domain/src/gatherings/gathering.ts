import { Temporal } from "temporal-polyfill";
import { z } from "zod";

import { fileKeySchema } from "../shared/files";
import {
  localizedTextSchema,
  optionalLocalizedTextSchema,
} from "../shared/localized-text";

export {
  localized,
  localizedTextSchema,
  optionalLocalizedTextSchema,
} from "../shared/localized-text";
export type { LocalizedText } from "../shared/localized-text";

/** What a Gathering is, for its badge and colour. */
export const GATHERING_TYPES = [
  "majlis",
  "lecture",
  "celebration",
  "mourning",
] as const;

export type GatheringType = (typeof GATHERING_TYPES)[number];

/** Who may attend a Gathering. */
export const ATTENDANCE = ["everyone", "men", "women"] as const;

export type Attendance = (typeof ATTENDANCE)[number];

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/u;
const TIME_OF_DAY = /^(?:[01]\d|2[0-3]):[0-5]\d$/u;

const isCalendarDate = (value: string): boolean => {
  try {
    return Temporal.PlainDate.from(value).toString() === value;
  } catch {
    return false;
  }
};

/** A Gregorian date, `YYYY-MM-DD`. */
export const isoDateSchema = z
  .string()
  .regex(ISO_DATE)
  .refine(isCalendarDate, "Not a calendar date");

/** A local time of day, `HH:MM` on a 24-hour clock. */
export const timeOfDaySchema = z.string().regex(TIME_OF_DAY);

/** The sheikh or orator leading a Gathering. */
export const speakerSchema = z.object({
  id: z.string().min(1),
  name: localizedTextSchema,
  photoKey: fileKeySchema.nullable(),
});

export type Speaker = z.infer<typeof speakerSchema>;

export const venueSchema = z.object({
  name: localizedTextSchema,
  address: z.string().trim(),
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
});

export type Venue = z.infer<typeof venueSchema>;

const livestreamUrlSchema = z.url({ protocol: /^https?$/u });

/**
 * A dated, located session led by a Speaker that Admins publish for
 * Believers to attend or stream. Its times are the venue's local time.
 * Devices show only active Gatherings. Without the end-after-start rule:
 * extend this, then apply `withTimesInOrder`.
 */
export const gatheringFieldsSchema = z.object({
  id: z.string().min(1),
  title: localizedTextSchema,
  description: optionalLocalizedTextSchema,
  type: z.enum(GATHERING_TYPES),
  date: isoDateSchema,
  startTime: timeOfDaySchema,
  endTime: timeOfDaySchema.nullable(),
  venue: venueSchema,
  speakerId: z.string().min(1).nullable(),
  livestreamUrl: livestreamUrlSchema.nullable(),
  attendance: z.enum(ATTENDANCE),
  active: z.boolean(),
});

/** Refuses an end time that is not after the start time. */
export const withTimesInOrder = <
  T extends z.ZodType<{ startTime: string; endTime: string | null }>,
>(
  schema: T
) =>
  schema.refine(
    ({ startTime, endTime }) => endTime === null || endTime > startTime,
    { message: "Ends before it starts", path: ["endTime"] }
  );

export const gatheringSchema = withTimesInOrder(gatheringFieldsSchema);

export type Gathering = z.infer<typeof gatheringSchema>;
