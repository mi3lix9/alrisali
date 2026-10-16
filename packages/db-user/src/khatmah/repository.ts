import {
  khatmahLogId,
  readKhatmahAdjustments,
  readKhatmahPlan,
  serialiseKhatmahPlan,
  withKhatmahAdjustments,
} from "@alrisali/domain/khatmah";
import type {
  Khatmah,
  KhatmahAdjustments,
  KhatmahLog,
  KhatmahPlan,
} from "@alrisali/domain/khatmah";
import { and, asc, eq, gte } from "drizzle-orm";
import { Temporal } from "temporal-polyfill";
import { z } from "zod";

import type { UserDb } from "../shared";
import { khatmahLogs, khatmahs } from "./schema";

/** What the Believer chooses when starting a Khatmah. */
export interface KhatmahDraft {
  plan: KhatmahPlan;
  startDate: Temporal.PlainDate;
  reminderAt: number | null;
}

export interface KhatmahRepository {
  /** Every Khatmah this app can read, oldest first. */
  list: () => Promise<Khatmah[]>;
  /** Validates and saves a new Khatmah under a caller-made uuid. */
  create: (id: string, draft: KhatmahDraft, at: Date) => Promise<Khatmah>;
  /** Sets or clears (null) the Khatmah's daily reminder time. */
  setReminder: (id: string, reminderAt: number | null) => Promise<void>;
  /**
   * Saves what rescheduling or "Mark done till…" changed about the Khatmah,
   * with the plan; none clears it.
   */
  setAdjustments: (id: string, adjust: KhatmahAdjustments) => Promise<void>;
  /** Deletes the logs of this session and every later one. */
  unlogFrom: (khatmahId: string, session: number) => Promise<void>;
  /** Deletes the Khatmah and its logs. */
  remove: (id: string) => Promise<void>;
  /** Every Khatmah Log, oldest date first. */
  logs: () => Promise<KhatmahLog[]>;
  /** Records a completed session (once, however often it is recorded). */
  log: (log: KhatmahLog, at: Date) => Promise<void>;
  /** Removes a session's log, making it unfinished again. */
  unlog: (khatmahId: string, session: number) => Promise<void>;
}

const reminderAtSchema = z
  .int()
  .min(0)
  .max(24 * 60 - 1)
  .nullable();

const idSchema = z.uuid();

type KhatmahRow = typeof khatmahs.$inferSelect;

/** The Khatmah a row holds, or null when this app cannot read it. */
const toKhatmah = (row: KhatmahRow): Khatmah | null => {
  const plan = readKhatmahPlan(row.plan);
  if (!plan) {
    return null;
  }
  const startDate = Temporal.PlainDate.from(row.startDate);
  const reminderAt = reminderAtSchema.safeParse(row.reminderAt);
  const adjust = readKhatmahAdjustments(row.plan);
  return {
    id: row.id,
    plan,
    startDate,
    reminderAt: reminderAt.success ? reminderAt.data : null,
    createdAt: row.createdAt.getTime(),
    ...(adjust.segments.length > 0 || adjust.partial ? { adjust } : {}),
  };
};

export const createKhatmahRepository = (db: UserDb): KhatmahRepository => ({
  list: async () => {
    const rows = await db
      .select()
      .from(khatmahs)
      .orderBy(asc(khatmahs.createdAt), asc(khatmahs.id))
      .all();
    return rows.flatMap((row) => {
      try {
        return toKhatmah(row) ?? [];
      } catch {
        // A start date this app cannot read.
        return [];
      }
    });
  },
  create: async (id, { plan, startDate, reminderAt }, at) => {
    const row = {
      id: idSchema.parse(id),
      plan: serialiseKhatmahPlan(plan),
      startDate: startDate.toString(),
      reminderAt: reminderAtSchema.parse(reminderAt),
      createdAt: at,
    };
    const khatmah = toKhatmah(row);
    if (!khatmah) {
      throw new Error("The Khatmah's plan is not valid");
    }
    await db.insert(khatmahs).values(row);
    return khatmah;
  },
  setReminder: async (id, reminderAt) => {
    await db
      .update(khatmahs)
      .set({ reminderAt: reminderAtSchema.parse(reminderAt) })
      .where(eq(khatmahs.id, id));
  },
  setAdjustments: async (id, adjust) => {
    const row = await db
      .select({ plan: khatmahs.plan })
      .from(khatmahs)
      .where(eq(khatmahs.id, id))
      .get();
    if (!row) {
      return;
    }
    await db
      .update(khatmahs)
      .set({ plan: withKhatmahAdjustments(row.plan, adjust) })
      .where(eq(khatmahs.id, id));
  },
  unlogFrom: async (khatmahId, session) => {
    await db
      .delete(khatmahLogs)
      .where(
        and(
          eq(khatmahLogs.khatmahId, khatmahId),
          gte(khatmahLogs.session, session)
        )
      );
  },
  remove: async (id) => {
    await db.delete(khatmahLogs).where(eq(khatmahLogs.khatmahId, id));
    await db.delete(khatmahs).where(eq(khatmahs.id, id));
  },
  logs: async () => {
    const rows = await db
      .select({
        khatmahId: khatmahLogs.khatmahId,
        session: khatmahLogs.session,
        date: khatmahLogs.date,
      })
      .from(khatmahLogs)
      .orderBy(asc(khatmahLogs.date), asc(khatmahLogs.session))
      .all();
    return rows.map(({ khatmahId, session, date }) => ({
      khatmahId,
      session,
      date: Temporal.PlainDate.from(date),
    }));
  },
  log: async ({ khatmahId, session, date }, at) => {
    await db
      .insert(khatmahLogs)
      .values({
        id: khatmahLogId(khatmahId, session),
        khatmahId,
        session,
        date: date.toString(),
        completedAt: at,
      })
      .onConflictDoNothing();
  },
  unlog: async (khatmahId, session) => {
    await db
      .delete(khatmahLogs)
      .where(eq(khatmahLogs.id, khatmahLogId(khatmahId, session)));
  },
});
