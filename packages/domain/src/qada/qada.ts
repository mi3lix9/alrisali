import { Temporal } from "temporal-polyfill";
import { z } from "zod";

import { SALAH, salahSchema } from "../shared";
import type { Salah } from "../shared";

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
    const logged = today.filter(
      (log) => log.kind === "salah" && log.salah === salah
    ).length;
    return Array.from(
      { length: Math.max(planned[salah], logged) },
      (_, index): QadaItem => ({
        id: salahItemId(date, salah, index + 1),
        kind: "salah",
        salah,
        logged: index < logged,
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

/**
 * The Qada Log for one more `salah` on `date`: the day's next of that Salah,
 * whether it is ticked on the dashboard or in the Prayer Log.
 */
export const nextQadaSalahLog = (
  logs: readonly QadaLog[],
  date: Temporal.PlainDate,
  salah: Salah
): QadaLog => ({
  id: salahItemId(date, salah, qadaSalahCount(logs, date, salah) + 1),
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
  const count = qadaSalahCount(logs, date, salah);
  return count === 0
    ? null
    : {
        id: salahItemId(date, salah, count),
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
