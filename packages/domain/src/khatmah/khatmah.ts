import { AYAT, HIZB_QUARTER_STARTS } from "@alrisali/content/quran";
import type { AyahKey } from "@alrisali/content/quran";
import type { Temporal } from "temporal-polyfill";
import { z } from "zod";

import type { KhatmahReminderPlan } from "../shared";

/** An even split runs from this many sessions... */
export const MIN_EVEN_DAYS = 3;
/** ...to one hizb quarter a session. */
export const MAX_EVEN_DAYS = 240;
/** The suggested plan: a juz (eight hizb quarters) a day. */
export const SUGGESTED_DAYS = 30;

/** How a Khatmah is divided into Khatmah Sessions. */
export const khatmahPlanSchema = z.discriminatedUnion("kind", [
  z.object({ kind: z.literal("suggested") }),
  z.object({
    kind: z.literal("even"),
    days: z.int().min(MIN_EVEN_DAYS).max(MAX_EVEN_DAYS),
  }),
]);

export type KhatmahPlan = z.infer<typeof khatmahPlanSchema>;

/** The plan stored as text, e.g. in the per-user database. */
export const serialiseKhatmahPlan = (plan: KhatmahPlan): string =>
  JSON.stringify(khatmahPlanSchema.parse(plan));

/** The plan stored text holds, or null when this app cannot read it. */
export const readKhatmahPlan = (stored: string): KhatmahPlan | null => {
  try {
    const parsed = khatmahPlanSchema.safeParse(JSON.parse(stored));
    return parsed.success ? parsed.data : null;
  } catch {
    return null;
  }
};

/** How many Khatmah Sessions a plan has, one a day. */
export const planDays = (plan: KhatmahPlan): number =>
  plan.kind === "suggested" ? SUGGESTED_DAYS : plan.days;

/** One scheduled portion of a Khatmah: a run of ayat, first to last. */
export interface KhatmahSession {
  /** From 1. */
  number: number;
  from: AyahKey;
  to: AyahKey;
  /** The Quran Pages the portion touches, its first and last page included. */
  pages: number;
  firstPage: number;
  lastPage: number;
}

const TOTAL_AYAT = AYAT.length;

/** Index in `AYAT` of the first ayah of each hizb quarter. */
const QUARTER_STARTS: readonly number[] = HIZB_QUARTER_STARTS.map((key) =>
  AYAT.findIndex((ayah) => ayah.key === key)
);

const sessionsCache = new Map<number, readonly KhatmahSession[]>();

/** `days` portions of whole hizb quarters, as even as 240 quarters allow. */
const evenSessions = (days: number): readonly KhatmahSession[] => {
  const cached = sessionsCache.get(days);
  if (cached) {
    return cached;
  }
  const quarters = QUARTER_STARTS.length;
  const sessions = Array.from({ length: days }, (_, index) => {
    const firstQuarter = Math.floor((index * quarters) / days);
    const lastQuarter = Math.floor(((index + 1) * quarters) / days) - 1;
    const first = QUARTER_STARTS[firstQuarter] ?? 0;
    const last =
      lastQuarter === quarters - 1
        ? TOTAL_AYAT - 1
        : (QUARTER_STARTS[lastQuarter + 1] ?? TOTAL_AYAT) - 1;
    const from = AYAT[first];
    const to = AYAT[last];
    if (!(from && to)) {
      throw new Error("A Khatmah Session has no ayat");
    }
    return {
      number: index + 1,
      from: from.key,
      to: to.key,
      pages: to.page - from.page + 1,
      firstPage: from.page,
      lastPage: to.page,
    };
  });
  sessionsCache.set(days, sessions);
  return sessions;
};

/**
 * A plan's Khatmah Sessions in order. Together they cover all 6236 ayat
 * exactly once, each session ending at a hizb quarter's end.
 */
export const sessionsFor = (plan: KhatmahPlan): readonly KhatmahSession[] =>
  evenSessions(planDays(plan));

/**
 * The session a portion's last ayah ends, or undefined when `ayah` ends none:
 * where "Complete today's portion" appears.
 */
export const portionEndingAt = (
  plan: KhatmahPlan,
  ayah: string
): KhatmahSession | undefined =>
  sessionsFor(plan).find((session) => session.to === ayah);

/** Whether `ayah` is the last ayah of one of the plan's sessions. */
export const isPortionEnd = (plan: KhatmahPlan, ayah: string): boolean =>
  portionEndingAt(plan, ayah) !== undefined;

/** A Khatmah: one plan the Believer follows from a start date. */
export interface Khatmah {
  id: string;
  plan: KhatmahPlan;
  /** The date of its first session; later ones follow a day apart. */
  startDate: Temporal.PlainDate;
  /** Minutes after local midnight its daily reminder fires; null for none. */
  reminderAt: number | null;
  /** When it was started, in epoch milliseconds. */
  createdAt: number;
}

/** A Khatmah Session the Believer completed, on the date they did. */
export interface KhatmahLog {
  khatmahId: string;
  session: number;
  date: Temporal.PlainDate;
}

/** The id a Khatmah Log is stored under: the same completion is one row. */
export const khatmahLogId = (khatmahId: string, session: number): string =>
  `${khatmahId}:${session}`;

/** The date a session is due. */
export const sessionDueDate = (
  khatmah: Khatmah,
  session: number
): Temporal.PlainDate => khatmah.startDate.add({ days: session - 1 });

export type KhatmahState = "on-track" | "ahead" | "behind" | "finished";

export interface KhatmahStatus {
  state: KhatmahState;
  /** How many sessions ahead or behind; 0 otherwise. */
  sessions: number;
  total: number;
  /** Sessions completed. */
  done: number;
  /** The first session not completed: today's portion; null once finished. */
  current: KhatmahSession | null;
  /** Whether a session was completed today. */
  completedToday: boolean;
  /** Quran Pages wholly inside completed sessions. */
  pagesRead: number;
  /** The last day of the plan as scheduled. */
  plannedFinish: Temporal.PlainDate;
  /**
   * The day the Khatmah ends at one session a day from now; null once it is
   * finished.
   */
  estimatedFinish: Temporal.PlainDate | null;
}

const clamp = (value: number, min: number, max: number): number =>
  Math.min(Math.max(value, min), max);

/** The session numbers a Khatmah has logs for, valid ones only. */
const doneSessions = (
  khatmah: Khatmah,
  logs: readonly KhatmahLog[]
): Set<number> => {
  const total = planDays(khatmah.plan);
  return new Set(
    logs
      .filter(
        ({ khatmahId, session }) =>
          khatmahId === khatmah.id &&
          Number.isInteger(session) &&
          session >= 1 &&
          session <= total
      )
      .map(({ session }) => session)
  );
};

/** Pages whose every ayah lies in a completed session. */
const pagesWhollyRead = (
  sessions: readonly KhatmahSession[],
  done: ReadonlySet<number>
): number => {
  const unread = new Set<number>();
  const touched = new Set<number>();
  for (const session of sessions) {
    for (let page = session.firstPage; page <= session.lastPage; page += 1) {
      touched.add(page);
      if (!done.has(session.number)) {
        unread.add(page);
      }
    }
  }
  // A page shared with an unread session is not yet fully read.
  return [...touched].filter((page) => !unread.has(page)).length;
};

/**
 * Where a Khatmah stands on `today`. Behind: sessions due before today are
 * not all done. Ahead: more are done than are due by the end of today.
 */
export const khatmahStatus = (
  khatmah: Khatmah,
  logs: readonly KhatmahLog[],
  today: Temporal.PlainDate
): KhatmahStatus => {
  const sessions = sessionsFor(khatmah.plan);
  const total = sessions.length;
  const doneSet = doneSessions(khatmah, logs);
  const done = doneSet.size;
  const daysIn = khatmah.startDate.until(today, { largestUnit: "days" }).days;
  const dueBeforeToday = clamp(daysIn, 0, total);
  const dueThroughToday = clamp(daysIn + 1, 0, total);

  let state: KhatmahState = "on-track";
  let gap = 0;
  if (done === total) {
    state = "finished";
  } else if (done > dueThroughToday) {
    state = "ahead";
    gap = done - dueThroughToday;
  } else if (done < dueBeforeToday) {
    state = "behind";
    gap = dueBeforeToday - done;
  }

  const current = sessions.find(({ number }) => !doneSet.has(number)) ?? null;
  const completedToday = logs.some(
    (log) =>
      log.khatmahId === khatmah.id &&
      doneSet.has(log.session) &&
      log.date.equals(today)
  );
  let firstReadingDay = completedToday ? today.add({ days: 1 }) : today;
  if (firstReadingDay.until(khatmah.startDate).sign > 0) {
    firstReadingDay = khatmah.startDate;
  }

  return {
    state,
    sessions: gap,
    total,
    done,
    current,
    completedToday,
    pagesRead: pagesWhollyRead(sessions, doneSet),
    plannedFinish: sessionDueDate(khatmah, total),
    estimatedFinish:
      state === "finished"
        ? null
        : firstReadingDay.add({ days: total - done - 1 }),
  };
};

export type KhatmahSessionState = "done" | "missed" | "today" | "upcoming";

export interface KhatmahSessionRow extends KhatmahSession {
  state: KhatmahSessionState;
  dueDate: Temporal.PlainDate;
  /** Days from today to the due date: negative for a past day. */
  daysFromToday: number;
  /** The day it was completed, when it was. */
  doneOn: Temporal.PlainDate | null;
}

/** Every session with its state on `today`, for the list of sessions. */
export const khatmahSessionRows = (
  khatmah: Khatmah,
  logs: readonly KhatmahLog[],
  today: Temporal.PlainDate
): KhatmahSessionRow[] => {
  const doneOn = new Map<number, Temporal.PlainDate>();
  for (const log of logs) {
    if (log.khatmahId === khatmah.id) {
      doneOn.set(log.session, log.date);
    }
  }
  return sessionsFor(khatmah.plan).map((session) => {
    const dueDate = sessionDueDate(khatmah, session.number);
    const daysFromToday = today.until(dueDate, { largestUnit: "days" }).days;
    const completed = doneOn.get(session.number) ?? null;
    let state: KhatmahSessionState = "upcoming";
    if (completed) {
      state = "done";
    } else if (daysFromToday < 0) {
      state = "missed";
    } else if (daysFromToday === 0) {
      state = "today";
    }
    return { ...session, state, dueDate, daysFromToday, doneOn: completed };
  });
};

/**
 * The Khatmah Log completing today's portion, when `ayah` is where that
 * portion ends; null otherwise (a finished Khatmah has none).
 */
export const completePortionAt = (
  khatmah: Khatmah,
  logs: readonly KhatmahLog[],
  ayah: string,
  today: Temporal.PlainDate
): KhatmahLog | null => {
  const { current } = khatmahStatus(khatmah, logs, today);
  return current?.to === ayah
    ? { khatmahId: khatmah.id, session: current.number, date: today }
    : null;
};

/**
 * What the Khatmah's daily reminder needs: the remaining portions in order,
 * the first read on `firstDate` (today, or tomorrow once today's is done).
 * Null when the Khatmah has no reminder or is finished.
 */
export const khatmahReminderPlan = (
  khatmah: Khatmah,
  logs: readonly KhatmahLog[],
  today: Temporal.PlainDate
): KhatmahReminderPlan | null => {
  const status = khatmahStatus(khatmah, logs, today);
  if (khatmah.reminderAt === null || status.current === null) {
    return null;
  }
  const doneSet = doneSessions(khatmah, logs);
  let firstDate = status.completedToday ? today.add({ days: 1 }) : today;
  if (firstDate.until(khatmah.startDate).sign > 0) {
    firstDate = khatmah.startDate;
  }
  return {
    reminderAt: khatmah.reminderAt,
    firstDate,
    portions: sessionsFor(khatmah.plan)
      .filter(({ number }) => !doneSet.has(number))
      .map(({ from, to }) => ({ from, to })),
  };
};
