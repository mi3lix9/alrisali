import { Temporal } from "temporal-polyfill";

import type { HijriDate } from "../shared/hijri";
import { SALAH } from "../shared/salah";
import type { Salah } from "../shared/salah";
import { isProgramAvailable } from "./program";
import type { Act, ActSchedule, ProgramAvailability } from "./program";
import type { Subscription } from "./subscription";

/** Whether an Act with this schedule is due on `date`. */
export const isActDueOn = (
  schedule: ActSchedule,
  date: Temporal.PlainDate
): boolean => {
  switch (schedule.kind) {
    case "weekdays": {
      return schedule.weekdays.includes(date.dayOfWeek);
    }
    case "once": {
      return schedule.date === date.toString();
    }
    default: {
      return true;
    }
  }
};

/** What a Program needs for its Acts to be listed on a date. */
export type ProgramWithActs = ProgramAvailability & {
  id: string;
  acts: readonly Act[];
};

/** An Act due on a date, with the Program it belongs to. */
export interface DueAct<P extends ProgramWithActs = ProgramWithActs> {
  program: P;
  act: Act;
}

/** The Acts done before and after one Salah. */
export interface SalahActs<P extends ProgramWithActs = ProgramWithActs> {
  salah: Salah;
  before: DueAct<P>[];
  after: DueAct<P>[];
}

/** A date's Acts: by Salah (only those with Acts, in prayer order), then general. */
export interface ActsForDate<P extends ProgramWithActs = ProgramWithActs> {
  bySalah: SalahActs<P>[];
  general: DueAct<P>[];
}

/**
 * The Acts a Believer has on a date: from their active (not paused)
 * Subscriptions, oldest first, to Programs that still exist and are
 * available on that date's Hijri Date, each Act in its Program's order.
 */
export const actsForDate = <P extends ProgramWithActs>({
  programs,
  subscriptions,
  date,
  hijriDate,
}: {
  programs: readonly P[];
  subscriptions: readonly Subscription[];
  date: Temporal.PlainDate;
  hijriDate: HijriDate;
}): ActsForDate<P> => {
  const byId = new Map(programs.map((program) => [program.id, program]));
  const due = subscriptions.flatMap(({ programId, paused }) => {
    const program = byId.get(programId);
    if (paused || !program || !isProgramAvailable(program, hijriDate)) {
      return [];
    }
    return program.acts
      .filter((act) => isActDueOn(act.schedule, date))
      .map((act) => ({ program, act }));
  });

  const bySalah = SALAH.map((salah) => ({
    salah,
    before: due.filter(
      ({ act }) => act.salah?.salah === salah && act.salah.timing === "before"
    ),
    after: due.filter(
      ({ act }) => act.salah?.salah === salah && act.salah.timing === "after"
    ),
  })).filter(({ before, after }) => before.length + after.length > 0);

  return { bySalah, general: due.filter(({ act }) => act.salah === null) };
};

export class FutureActDateError extends Error {
  constructor(date: Temporal.PlainDate) {
    super(`An Act cannot be completed for a future date (${date.toString()})`);
    this.name = "FutureActDateError";
  }
}

/**
 * An Act can be completed for today or a past date. Throws
 * `FutureActDateError` for a later date.
 */
export const assertCanCompleteAct = (
  date: Temporal.PlainDate,
  today: Temporal.PlainDate
): void => {
  if (Temporal.PlainDate.compare(date, today) > 0) {
    throw new FutureActDateError(date);
  }
};

/** The Programs the Believer has not opened yet, in their order. */
export const unseenPrograms = <P extends { id: string }>(
  programs: readonly P[],
  seenIds: ReadonlySet<string>
): P[] => programs.filter(({ id }) => !seenIds.has(id));
