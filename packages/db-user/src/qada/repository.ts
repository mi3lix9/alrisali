import {
  DEFAULT_QADA_REMINDER,
  FutureQadaDateError,
  qadaPlanSchema,
  qadaReminderSchema,
  readQadaLog,
} from "@alrisali/domain/qada";
import type { QadaLog, QadaPlan } from "@alrisali/domain/qada";
import { asc, eq } from "drizzle-orm";
import { Temporal } from "temporal-polyfill";

import type { UserDb } from "../shared";
import { qadaLogs, qadaPlan } from "./schema";

export interface QadaRepository {
  /** The Believer's Qada Plan; null until they set one up. */
  plan: () => Promise<QadaPlan | null>;
  /** Validates and saves the whole plan, then returns it. */
  savePlan: (plan: QadaPlan, at: Date) => Promise<QadaPlan>;
  /** Every Qada Log, oldest first. */
  logs: () => Promise<QadaLog[]>;
  /**
   * Records one Qada Log (once, however often it is recorded). Throws
   * `FutureQadaDateError` for a date after `today`, saving nothing.
   */
  log: (
    log: QadaLog,
    options: { today: Temporal.PlainDate; at: Date }
  ) => Promise<void>;
  /** Removes one Qada Log, giving its item back to the backlog. */
  unlog: (id: string) => Promise<void>;
}

/** One row, with a stable id so sync merges it. */
const ROW_ID = "believer";

/** The stored weekdays if this app reads them, else every day. */
const readWeekdays = (stored: string): QadaPlan["reminder"]["weekdays"] => {
  try {
    const parsed = qadaReminderSchema.shape.weekdays.safeParse(
      JSON.parse(stored)
    );
    return parsed.success ? parsed.data : DEFAULT_QADA_REMINDER.weekdays;
  } catch {
    return DEFAULT_QADA_REMINDER.weekdays;
  }
};

export const createQadaRepository = (db: UserDb): QadaRepository => ({
  plan: async () => {
    const row = await db
      .select()
      .from(qadaPlan)
      .where(eq(qadaPlan.id, ROW_ID))
      .get();
    if (!row) {
      return null;
    }
    return {
      backlog: {
        salah: {
          fajr: row.fajr,
          dhuhr: row.dhuhr,
          asr: row.asr,
          maghrib: row.maghrib,
          isha: row.isha,
        },
        fasts: row.fasts,
      },
      pace: { salahPerDay: row.salahPerDay, fastsPerWeek: row.fastsPerWeek },
      reminder: {
        enabled: row.reminderEnabled,
        at: row.reminderAt,
        weekdays: readWeekdays(row.reminderWeekdays),
      },
    };
  },
  savePlan: async (plan, at) => {
    const { backlog, pace, reminder } = qadaPlanSchema.parse(plan);
    const columns = {
      ...backlog.salah,
      fasts: backlog.fasts,
      salahPerDay: pace.salahPerDay,
      fastsPerWeek: pace.fastsPerWeek,
      reminderEnabled: reminder.enabled,
      reminderAt: reminder.at,
      reminderWeekdays: JSON.stringify(reminder.weekdays),
      updatedAt: at,
    };
    await db
      .insert(qadaPlan)
      .values({ id: ROW_ID, ...columns })
      .onConflictDoUpdate({ target: qadaPlan.id, set: columns });
    return { backlog, pace, reminder };
  },
  logs: async () => {
    const rows = await db
      .select({
        id: qadaLogs.id,
        date: qadaLogs.date,
        kind: qadaLogs.kind,
        salah: qadaLogs.salah,
      })
      .from(qadaLogs)
      .orderBy(asc(qadaLogs.date), asc(qadaLogs.loggedAt))
      .all();
    // A newer app may have synced a kind this one does not know.
    return rows.flatMap((row) => {
      const log = readQadaLog(row);
      return log ? [log] : [];
    });
  },
  log: async (log, { today, at }) => {
    if (Temporal.PlainDate.compare(log.date, today) > 0) {
      throw new FutureQadaDateError(log.date);
    }
    await db
      .insert(qadaLogs)
      .values({
        id: log.id,
        date: log.date.toString(),
        kind: log.kind,
        salah: log.kind === "salah" ? log.salah : null,
        loggedAt: at,
      })
      .onConflictDoNothing();
  },
  unlog: async (id) => {
    await db.delete(qadaLogs).where(eq(qadaLogs.id, id));
  },
});
