import { Temporal } from "temporal-polyfill";
import { z } from "zod";

import { SALAH, salahSchema } from "../shared";
import type { QadaReminderPlan, Salah, Weekday } from "../shared";

/**
 * What the Believer has to make up: missed Salah, counted per Salah, and
 * missed fasts. The Qada Plan keeps what they entered; what remains is that
 * less every Qada Log (`remainingBacklog`).
 */
export interface QadaBacklog {
  salah: Readonly<Record<Salah, number>>;
  fasts: number;
}

/** How fast the Believer makes the backlog up. */
export interface QadaPace {
  /** Qada Salah each day, spread over the five. */
  salahPerDay: number;
  /** Qada fasts each week (Saturday to Friday). */
  fastsPerWeek: number;
}

/**
 * One Qada Salah or fast made up on `date`. The id is derived from what was
 * made up (`<date>:salah:<salah>:<n>` for the day's n-th of that Salah,
 * `<date>:fast` for the day's fast), so the same item logged on two devices,
 * or from the Qada dashboard and the Prayer Log, is one record.
 */
export type QadaLog =
  | { id: string; date: Temporal.PlainDate; kind: "salah"; salah: Salah }
  | { id: string; date: Temporal.PlainDate; kind: "fast" };

/** One of today's Qada items, ticked once its Qada Log exists. */
export type QadaItem =
  | { id: string; kind: "salah"; salah: Salah; logged: boolean }
  | { id: string; kind: "fast"; logged: boolean };

/** The most a single count may hold: well beyond a lifetime of Salah. */
export const MAX_QADA_COUNT = 100_000;
export const MAX_SALAH_PER_DAY = 50;
export const MAX_FASTS_PER_WEEK = 7;

const countSchema = z.number().int().min(0).max(MAX_QADA_COUNT);

export const qadaBacklogSchema = z.object({
  salah: z.object({
    fajr: countSchema,
    dhuhr: countSchema,
    asr: countSchema,
    maghrib: countSchema,
    isha: countSchema,
  }),
  fasts: countSchema,
});

export const qadaPaceSchema = z.object({
  salahPerDay: z.number().int().min(1).max(MAX_SALAH_PER_DAY),
  fastsPerWeek: z.number().int().min(0).max(MAX_FASTS_PER_WEEK),
});

/** Nothing to make up: the backlog before setup. */
export const EMPTY_QADA_BACKLOG: QadaBacklog = {
  salah: { fajr: 0, dhuhr: 0, asr: 0, maghrib: 0, isha: 0 },
  fasts: 0,
};

/** A full day of Salah each day and two fasts a week. */
export const DEFAULT_QADA_PACE: QadaPace = { salahPerDay: 5, fastsPerWeek: 2 };

/**
 * The periods a Believer can pick instead of counting: each gives that many
 * days of every Salah. A month is counted as 30 days.
 */
export const QADA_PRESETS = [
  { id: "days10", days: 10 },
  { id: "month1", days: 30 },
  { id: "months6", days: 180 },
  { id: "year1", days: 360 },
  { id: "months18", days: 540 },
  { id: "years2", days: 720 },
] as const;

export type QadaPreset = (typeof QADA_PRESETS)[number];

/** Each of the five Salah missed for the preset's days. */
export const presetSalahBacklog = (
  preset: QadaPreset
): Record<Salah, number> => ({
  fajr: preset.days,
  dhuhr: preset.days,
  asr: preset.days,
  maghrib: preset.days,
  isha: preset.days,
});

/** The preset whose days every Salah holds, if any. */
export const matchingPreset = (
  salah: Readonly<Record<Salah, number>>
): QadaPreset | null =>
  QADA_PRESETS.find((preset) =>
    SALAH.every((name) => salah[name] === preset.days)
  ) ?? null;

/** The backlog with one Qada Log made up; never below zero. */
export const applyQadaLog = (
  backlog: QadaBacklog,
  log: QadaLog
): QadaBacklog =>
  log.kind === "fast"
    ? { salah: backlog.salah, fasts: Math.max(0, backlog.fasts - 1) }
    : {
        salah: {
          ...backlog.salah,
          [log.salah]: Math.max(0, backlog.salah[log.salah] - 1),
        },
        fasts: backlog.fasts,
      };

/** Each Qada Log once, however often it was recorded. */
const distinct = (logs: readonly QadaLog[]): QadaLog[] => [
  ...new Map(logs.map((log) => [log.id, log])).values(),
];

/** What is left to make up after every Qada Log. */
export const remainingBacklog = (
  backlog: QadaBacklog,
  logs: readonly QadaLog[]
): QadaBacklog => {
  let remaining = backlog;
  for (const log of distinct(logs)) {
    remaining = applyQadaLog(remaining, log);
  }
  return remaining;
};

/** All Qada Salah left, over the five. */
export const totalSalah = (backlog: QadaBacklog): number =>
  SALAH.reduce((total, salah) => total + backlog.salah[salah], 0);

/** The Saturday that starts `date`'s week. */
const weekStart = (date: Temporal.PlainDate): Temporal.PlainDate =>
  date.subtract({ days: (date.dayOfWeek + 1) % 7 });

const salahItemId = (
  date: Temporal.PlainDate,
  salah: Salah,
  index: number
): string => `${date.toString()}:salah:${salah}:${index}`;

/** The numbers of `salah`'s items ticked on `date`: the item ids the day's Qada Logs carry. */
const loggedIndexes = (
  logs: readonly QadaLog[],
  date: Temporal.PlainDate,
  salah: Salah
): number[] => {
  const prefix = salahItemId(date, salah, 0).slice(0, -1);
  return distinct(logs)
    .filter(
      (log) =>
        log.kind === "salah" && log.salah === salah && log.id.startsWith(prefix)
    )
    .map((log) => Number(log.id.slice(prefix.length)))
    .filter((index) => Number.isInteger(index) && index > 0)
    .toSorted((a, b) => a - b);
};

const fastItemId = (date: Temporal.PlainDate): string =>
  `${date.toString()}:fast`;

/**
 * Which Salah the pace asks for on a day, from what remained when it began:
 * each pick goes to the Salah with the most left (the earlier in the day on
 * a tie), so the five shrink together.
 */
const plannedSalah = (
  remaining: QadaBacklog,
  salahPerDay: number
): Record<Salah, number> => {
  const planned: Record<Salah, number> = {
    fajr: 0,
    dhuhr: 0,
    asr: 0,
    maghrib: 0,
    isha: 0,
  };
  for (let pick = 0; pick < salahPerDay; pick += 1) {
    let next: Salah | null = null;
    for (const salah of SALAH) {
      const left = remaining.salah[salah] - planned[salah];
      if (
        left > 0 &&
        (next === null || left > remaining.salah[next] - planned[next])
      ) {
        next = salah;
      }
    }
    if (next === null) {
      break;
    }
    planned[next] += 1;
  }
  return planned;
};

/**
 * Today's Qada items: the Salah the pace asks for (planned from what remained
 * when the day began, so ticking does not reshuffle the list), in the day's
 * order, then a fast while the week's fasts are not yet kept. A Qada Log made
 * beyond the plan (from the Prayer Log) shows as one more ticked item.
 */
export const qadaToday = (
  backlog: QadaBacklog,
  pace: QadaPace,
  logs: readonly QadaLog[],
  date: Temporal.PlainDate
): QadaItem[] => {
  const unique = distinct(logs);
  const earlier = unique.filter(
    (log) => Temporal.PlainDate.compare(log.date, date) < 0
  );
  const today = unique.filter((log) => log.date.equals(date));
  const remaining = remainingBacklog(backlog, earlier);
  const planned = plannedSalah(remaining, pace.salahPerDay);

  const salahItems = SALAH.flatMap((salah): QadaItem[] => {
    // An item is ticked when its own Qada Log exists: the Believer may
    // tick any item, and un-ticking one leaves the others as they were.
    const logged = new Set(loggedIndexes(today, date, salah));
    const highest = Math.max(0, ...logged);
    return Array.from(
      { length: Math.max(planned[salah], highest) },
      (_, index): QadaItem => ({
        id: salahItemId(date, salah, index + 1),
        kind: "salah",
        salah,
        logged: logged.has(index + 1),
      })
    );
  });

  const fastLogged = today.some((log) => log.kind === "fast");
  const week = weekStart(date);
  const fastsThisWeek = earlier.filter(
    (log) =>
      log.kind === "fast" && Temporal.PlainDate.compare(log.date, week) >= 0
  ).length;
  const fastPlanned = remaining.fasts > 0 && fastsThisWeek < pace.fastsPerWeek;
  const fastItems: QadaItem[] =
    fastLogged || fastPlanned
      ? [{ id: fastItemId(date), kind: "fast", logged: fastLogged }]
      : [];

  return [...salahItems, ...fastItems];
};

/** How many Qada Salah of `salah` were logged on `date`. */
export const qadaSalahCount = (
  logs: readonly QadaLog[],
  date: Temporal.PlainDate,
  salah: Salah
): number =>
  distinct(logs).filter(
    (log) =>
      log.kind === "salah" && log.salah === salah && log.date.equals(date)
  ).length;

/** The lowest item number not yet ticked. */
const firstFreeIndex = (taken: readonly number[]): number => {
  let index = 1;
  while (taken.includes(index)) {
    index += 1;
  }
  return index;
};

/**
 * The Qada Log for one more `salah` on `date`: the day's next of that Salah,
 * whether it is ticked on the dashboard or in the Prayer Log.
 */
export const nextQadaSalahLog = (
  logs: readonly QadaLog[],
  date: Temporal.PlainDate,
  salah: Salah
): QadaLog => ({
  id: salahItemId(
    date,
    salah,
    firstFreeIndex(loggedIndexes(logs, date, salah))
  ),
  date,
  kind: "salah",
  salah,
});

/** The last Qada Log of `salah` on `date`, the one un-ticking removes. */
export const lastQadaSalahLog = (
  logs: readonly QadaLog[],
  date: Temporal.PlainDate,
  salah: Salah
): QadaLog | null => {
  const highest = loggedIndexes(logs, date, salah).at(-1);
  return highest === undefined
    ? null
    : {
        id: salahItemId(date, salah, highest),
        date,
        kind: "salah",
        salah,
      };
};

/** The Qada Log of `date`'s fast. */
export const qadaFastLog = (date: Temporal.PlainDate): QadaLog => ({
  id: fastItemId(date),
  date,
  kind: "fast",
});

/** The Qada Log a ticked item records. */
export const qadaItemLog = (
  item: QadaItem,
  date: Temporal.PlainDate
): QadaLog =>
  item.kind === "fast"
    ? qadaFastLog(date)
    : { id: item.id, date, kind: "salah", salah: item.salah };

/**
 * Reads a stored Qada Log; null when it is not one this app understands (a
 * newer app may have synced a kind it does not know).
 */
export const readQadaLog = (stored: {
  id: string;
  date: string;
  kind: string;
  salah: string | null;
}): QadaLog | null => {
  let date: Temporal.PlainDate;
  try {
    date = Temporal.PlainDate.from(stored.date, { overflow: "reject" });
  } catch {
    return null;
  }
  if (stored.kind === "fast") {
    return { id: stored.id, date, kind: "fast" };
  }
  const salah = salahSchema.safeParse(stored.salah);
  return stored.kind === "salah" && salah.success
    ? { id: stored.id, date, kind: "salah", salah: salah.data }
    : null;
};

/**
 * How many days the pace needs to make up every remaining Qada Salah; 0 when
 * none remain.
 */
export const qadaDaysLeft = (backlog: QadaBacklog, pace: QadaPace): number =>
  Math.ceil(totalSalah(backlog) / pace.salahPerDay);

/** How many Qada items were logged on each date, by ISO date. */
export const qadaDayCounts = (
  logs: readonly QadaLog[]
): ReadonlyMap<string, number> => {
  const counts = new Map<string, number>();
  for (const log of distinct(logs)) {
    const day = log.date.toString();
    counts.set(day, (counts.get(day) ?? 0) + 1);
  }
  return counts;
};

export interface QadaCalendarDay {
  date: Temporal.PlainDate;
  /** Qada items logged that day. */
  count: number;
  /** After `today`: nothing can be logged yet. */
  future: boolean;
}

/**
 * The Qada calendar: `weeks` rows of seven (Saturday first), ending with the
 * week of `today`, each day with what was made up on it.
 */
export const qadaCalendar = (
  logs: readonly QadaLog[],
  today: Temporal.PlainDate,
  weeks: number
): QadaCalendarDay[][] => {
  const counts = qadaDayCounts(logs);
  const first = weekStart(today).subtract({ weeks: weeks - 1 });
  return Array.from({ length: weeks }, (_, week) =>
    Array.from({ length: 7 }, (__, day): QadaCalendarDay => {
      const date = first.add({ days: week * 7 + day });
      return {
        date,
        count: counts.get(date.toString()) ?? 0,
        future: Temporal.PlainDate.compare(date, today) > 0,
      };
    })
  );
};

/** When the Qada Reminder fires. */
export interface QadaReminder {
  enabled: boolean;
  /** Minutes after local midnight. */
  at: number;
  /** The weekdays it fires on (ISO, 1 is Monday); all seven is every day. */
  weekdays: readonly Weekday[];
}

/** What the Believer set up: the backlog they entered, the pace, the Reminder. */
export interface QadaPlan {
  backlog: QadaBacklog;
  pace: QadaPace;
  reminder: QadaReminder;
}

const ALL_WEEKDAYS: readonly Weekday[] = [1, 2, 3, 4, 5, 6, 7];

/** Off, at 21:00 every day: the Reminder before the Believer sets one. */
export const DEFAULT_QADA_REMINDER: QadaReminder = {
  enabled: false,
  at: 21 * 60,
  weekdays: ALL_WEEKDAYS,
};

/**
 * The Qada Reminder the Reminders schedule; null while it is off, has no
 * weekday, or nothing is left to make up.
 */
export const qadaReminderPlan = (
  plan: QadaPlan,
  logs: readonly QadaLog[]
): QadaReminderPlan | null => {
  const { reminder, pace } = plan;
  const remaining = remainingBacklog(plan.backlog, logs);
  if (
    !reminder.enabled ||
    reminder.weekdays.length === 0 ||
    (totalSalah(remaining) === 0 && remaining.fasts === 0)
  ) {
    return null;
  }
  const weekdays = [...new Set(reminder.weekdays)].toSorted((a, b) => a - b);
  return {
    schedule:
      weekdays.length === ALL_WEEKDAYS.length
        ? { kind: "daily" }
        : { kind: "weekdays", weekdays },
    reminderAt: reminder.at,
    salahPerDay: pace.salahPerDay,
  };
};

export const qadaReminderSchema = z.object({
  enabled: z.boolean(),
  at: z
    .number()
    .int()
    .min(0)
    .max(24 * 60 - 1),
  weekdays: z.array(
    z
      .number()
      .int()
      .min(1)
      .max(7)
      .transform((day) => day as Weekday)
  ),
});

export const qadaPlanSchema = z.object({
  backlog: qadaBacklogSchema,
  pace: qadaPaceSchema,
  reminder: qadaReminderSchema,
});

/** A Qada item can be logged for today or a past date, never a future one. */
export class FutureQadaDateError extends Error {
  constructor(date: Temporal.PlainDate) {
    super(`Qada cannot be logged for a future date (${date.toString()})`);
    this.name = "FutureQadaDateError";
  }
}
