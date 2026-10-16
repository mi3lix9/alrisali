import {
  canLogDate,
  FutureDateError,
  setSalahPerformed,
} from "@alrisali/domain/prayer-log";
import type { PrayerLog } from "@alrisali/domain/prayer-log";
import { SALAH, salahSchema } from "@alrisali/domain/shared";
import type { Salah } from "@alrisali/domain/shared";
import { and, asc, eq, inArray } from "drizzle-orm";
import { Temporal } from "temporal-polyfill";

import type { UserDb } from "../shared";
import { prayerLogs } from "./schema";

export interface SetSalahPerformed {
  date: Temporal.PlainDate;
  salah: Salah;
  /** True ticks the Salah, false un-ticks it. */
  performed: boolean;
  /** The Believer's local date; a later `date` is refused. */
  today: Temporal.PlainDate;
  /** When the tick was made. */
  at: Date;
}

export interface PrayerLogRepository {
  /** Every date with a logged Salah, oldest first. */
  logs: () => Promise<PrayerLog[]>;
  /**
   * Ticks or un-ticks one Salah and returns the date's Prayer Log. Throws
   * `FutureDateError` for a date after `today`, saving nothing.
   */
  setPerformed: (change: SetSalahPerformed) => Promise<PrayerLog>;
}

interface LoggedRow {
  date: string;
  salah: string;
}

/** One Prayer Log per date, from rows already ordered by date. */
const group = (found: LoggedRow[]): PrayerLog[] => {
  const byDate = new Map<string, PrayerLog>();
  for (const row of found) {
    const salah = salahSchema.safeParse(row.salah);
    if (salah.success) {
      const log = byDate.get(row.date) ?? {
        date: Temporal.PlainDate.from(row.date),
        performed: [],
      };
      byDate.set(row.date, setSalahPerformed(log, salah.data, true));
    }
  }
  return [...byDate.values()];
};

export const createPrayerLogRepository = (db: UserDb): PrayerLogRepository => {
  // A newer app may have synced a Salah name this one does not know.
  const rows = (date?: string): Promise<LoggedRow[]> =>
    db
      .select({ date: prayerLogs.date, salah: prayerLogs.salah })
      .from(prayerLogs)
      .where(
        and(
          inArray(prayerLogs.salah, SALAH),
          date === undefined ? undefined : eq(prayerLogs.date, date)
        )
      )
      .orderBy(asc(prayerLogs.date))
      .all();

  return {
    logs: async () => group(await rows()),
    setPerformed: async ({ date, salah, performed, today, at }) => {
      if (!canLogDate(date, today)) {
        throw new FutureDateError(date);
      }
      const day = date.toString();
      const id = `${day}:${salahSchema.parse(salah)}`;
      await (performed
        ? db
            .insert(prayerLogs)
            .values({ id, date: day, salah, loggedAt: at })
            .onConflictDoNothing()
        : db.delete(prayerLogs).where(eq(prayerLogs.id, id)));
      const [log] = group(await rows(day));
      return log ?? { date, performed: [] };
    },
  };
};
