import type { Temporal } from "temporal-polyfill";

import type { HijriCalendar, HijriMonthDay } from "../shared";
import {
  MAX_EVEN_DAYS,
  MIN_EVEN_DAYS,
  planEvery,
  sessionsFor,
} from "./khatmah";
import type { KhatmahPlan } from "./khatmah";
import { READING_MINUTES_PER_PAGE } from "./plans";
import type { SessionInterval } from "./plans";

/** How a plan looks before it is started: what it asks of the Believer. */
export interface KhatmahPreview {
  sessions: number;
  everyDays: SessionInterval;
  /** Quran Pages a session covers on average. */
  pagesPerSession: number;
  /** An estimate at `READING_MINUTES_PER_PAGE` a page. */
  minutesPerSession: number;
  /** The day of the last session, started on `start`. */
  finish: Temporal.PlainDate;
}

/**
 * What a plan commits to when started on `start`: the amount a session, the
 * minutes it takes, and the finishing day.
 */
export const previewPlan = (
  plan: KhatmahPlan,
  start: Temporal.PlainDate
): KhatmahPreview => {
  const sessions = sessionsFor(plan);
  const [first] = sessions;
  const last = sessions.at(-1);
  const pages = first && last ? last.lastPage - first.firstPage + 1 : 0;
  const pagesPerSession = pages / Math.max(sessions.length, 1);
  const everyDays = planEvery(plan);
  return {
    sessions: sessions.length,
    everyDays,
    pagesPerSession,
    minutesPerSession: Math.max(
      1,
      Math.round(pagesPerSession * READING_MINUTES_PER_PAGE)
    ),
    finish: start.add({ days: (sessions.length - 1) * everyDays }),
  };
};

export type DeadlineResult =
  | { ok: true; plan: KhatmahPlan; finish: Temporal.PlainDate }
  | { ok: false; reason: "past" | "tooShort" | "tooLong" };

/**
 * An even plan whose last session falls on `deadline`, or as near before it
 * as the interval allows (every 7 days, up to six days early). Sessions run
 * from `start`, one every `every` days; the plan has 3 to 240 of them.
 */
export const planForDeadline = ({
  start,
  deadline,
  every = 1,
}: {
  start: Temporal.PlainDate;
  deadline: Temporal.PlainDate;
  every?: SessionInterval;
}): DeadlineResult => {
  const span = start.until(deadline, { largestUnit: "days" }).days;
  if (span < 0) {
    return { ok: false, reason: "past" };
  }
  const days = Math.floor(span / every) + 1;
  if (days < MIN_EVEN_DAYS) {
    return { ok: false, reason: "tooShort" };
  }
  if (days > MAX_EVEN_DAYS) {
    return { ok: false, reason: "tooLong" };
  }
  return {
    ok: true,
    plan: { kind: "even", days, ...(every === 1 ? {} : { every }) },
    finish: start.add({ days: (days - 1) * every }),
  };
};

/**
 * The next time a Hijri day (such as 29 Ramadan) falls on or after `from`,
 * on `calendar`. A day the month lacks (the 30th) falls on its last day.
 */
export const nextHijriOccurrence = (
  calendar: HijriCalendar,
  from: Temporal.PlainDate,
  { month, day }: HijriMonthDay
): Temporal.PlainDate => {
  const { year } = calendar.toHijri(from);
  for (const candidateYear of [year, year + 1]) {
    const date = calendar.toGregorian({
      year: candidateYear,
      month,
      day: Math.min(day, calendar.monthLength(candidateYear, month)),
    });
    if (date.until(from).sign <= 0) {
      return date;
    }
  }
  throw new RangeError("No Hijri occurrence found");
};
