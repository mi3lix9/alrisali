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

/** What a worship mapping lists besides the weekday's dua. */
export const WORSHIP_KINDS = ["ziyarah", "night-dua", "every-day"] as const;

export type WorshipKind = (typeof WORSHIP_KINDS)[number];

/** The `day` of an every-day entry; the others name a weekday. */
export const EVERY_DAY = "every";

/**
 * One entry of the worship mapping Admins publish: a Supplication (by id)
 * for a weekday's ziyarah, a weekday's night dua (shown after Maghrib of that
 * weekday), or every day. A weekday may list several.
 */
export const worshipEntrySchema = z
  .object({
    kind: z.enum(WORSHIP_KINDS),
    day: z.enum([...WEEKDAYS, EVERY_DAY]),
    supplicationId: supplicationIdSchema,
  })
  .refine(
    ({ kind, day }) => (kind === "every-day") === (day === EVERY_DAY),
    "Every-day entries have no weekday; the others need one"
  );

export type WorshipEntry = z.infer<typeof worshipEntrySchema>;

export interface TodaysWorship {
  /** The weekday's dua. */
  dua: SupplicationEntry | undefined;
  ziyarah: SupplicationEntry[];
  everyDay: SupplicationEntry[];
  /** Tonight's dua; empty until Maghrib. */
  tonight: SupplicationEntry[];
}

const resolved = (
  entries: readonly { kind: string; day: string; supplicationId: string }[],
  kind: WorshipKind,
  day: string
): SupplicationEntry[] =>
  entries
    .filter((entry) => entry.kind === kind && entry.day === day)
    .flatMap((entry) => getSupplication(entry.supplicationId) ?? []);

/**
 * Everything Home and Worship offer for the Believer's local day `today`:
 * the weekday's dua (`weekdayDuas`, the Daily Content map) and ziyarah, the
 * every-day items, and, once `afterMaghrib`, tonight's dua. Ids no Book holds
 * are dropped.
 */
export const todaysWorship = ({
  weekdayDuas,
  entries,
  today,
  afterMaghrib,
}: {
  weekdayDuas: readonly { weekday: string; supplicationId: string }[];
  entries: readonly { kind: string; day: string; supplicationId: string }[];
  today: Temporal.PlainDate;
  afterMaghrib: boolean;
}): TodaysWorship => {
  const weekday = weekdayOf(today);
  return {
    dua: todaysDailyContent(weekdayDuas, today),
    ziyarah: resolved(entries, "ziyarah", weekday),
    everyDay: resolved(entries, "every-day", EVERY_DAY),
    tonight: afterMaghrib ? resolved(entries, "night-dua", weekday) : [],
  };
};
