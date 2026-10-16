import { getSupplication } from "@alrisali/content/books";
import type { SupplicationEntry } from "@alrisali/content/books";
import type { Temporal } from "temporal-polyfill";
import { z } from "zod";

/** The weekdays Admins choose Daily Content for, from Saturday as the app's week starts. */
export const WEEKDAYS = [
  "saturday",
  "sunday",
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
] as const;

export type Weekday = (typeof WEEKDAYS)[number];

// ISO `dayOfWeek` order: 1 is Monday, 7 is Sunday.
const BY_ISO_DAY: readonly Weekday[] = [
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
  "sunday",
];

/** The weekday of a calendar day. */
export const weekdayOf = (date: Temporal.PlainDate): Weekday =>
  BY_ISO_DAY[date.dayOfWeek - 1] ?? "sunday";

/** A Supplication id some Book holds; nothing else can be featured. */
export const supplicationIdSchema = z
  .string()
  .refine((id) => getSupplication(id) !== undefined, "No such Supplication");

/** One weekday's Daily Content: the Supplication Home features that day. */
export const dailyContentSchema = z.object({
  weekday: z.enum(WEEKDAYS),
  supplicationId: supplicationIdSchema,
});

export type DailyContent = z.infer<typeof dailyContentSchema>;

/**
 * The Daily Content of the Believer's local day `today`, resolved to its Supplication; undefined when Admins
 * chose nothing for today or chose an id no Book holds.
 */
export const todaysDailyContent = (
  entries: readonly { weekday: string; supplicationId: string }[],
  today: Temporal.PlainDate
): SupplicationEntry | undefined => {
  const weekday = weekdayOf(today);
  const chosen = entries.find((entry) => entry.weekday === weekday);
  return chosen ? getSupplication(chosen.supplicationId) : undefined;
};
