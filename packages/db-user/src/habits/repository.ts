import {
  DEFAULT_HABITS,
  FutureHabitDateError,
  habitNameSchema,
  habitPresetSchema,
  reminderAtSchema,
} from "@alrisali/domain/habits";
import type { Habit, HabitDraft } from "@alrisali/domain/habits";
import {
  readHabitSchedule,
  serialiseHabitSchedule,
} from "@alrisali/domain/shared";
import { asc, eq } from "drizzle-orm";
import { Temporal } from "temporal-polyfill";
import { z } from "zod";

import type { UserDb } from "../shared";
import { habitCompletions, habits, habitSeeds } from "./schema";

/** One date a Habit was ticked. */
export interface HabitCompletion {
  habitId: string;
  date: Temporal.PlainDate;
}

export interface SetHabitCompleted {
  habitId: string;
  date: Temporal.PlainDate;
  /** True ticks the Habit for `date`, false un-ticks it. */
  completed: boolean;
  /** The Believer's local date; a later `date` is refused. */
  today: Temporal.PlainDate;
  /** When the tick was made. */
  at: Date;
}

export interface HabitRepository {
  /**
   * Adds the default Habits the first time it runs for this Believer, and
   * never again, even after they are deleted.
   */
  seedDefaults: (at: Date) => Promise<void>;
  /** Every Habit this app can read, archived ones included, oldest first. */
  list: () => Promise<Habit[]>;
  /** Validates and saves a new Habit with a caller-made uuid. */
  create: (id: string, draft: HabitDraft, at: Date) => Promise<Habit>;
  setArchived: (id: string, archived: boolean, at: Date) => Promise<void>;
  /** Deletes the Habit and its completions. */
  remove: (id: string) => Promise<void>;
  /**
   * Ticks or un-ticks a Habit for a date. Throws `FutureHabitDateError` for a
   * date after `today`, saving nothing.
   */
  setCompleted: (change: SetHabitCompleted) => Promise<void>;
  /** Every completion, oldest date first. */
  completions: () => Promise<HabitCompletion[]>;
}

const SEED_ID = "defaults";

const draftSchema = z.object({
  id: z.uuid(),
  name: habitNameSchema,
  reminderAt: reminderAtSchema.nullable(),
});

type HabitRow = typeof habits.$inferSelect;

/** The Habit a row holds, or null when this app cannot read it. */
const toHabit = (row: HabitRow): Habit | null => {
  const schedule = readHabitSchedule(row.schedule);
  const preset =
    row.preset === null ? null : habitPresetSchema.safeParse(row.preset);
  if (!schedule || preset?.success === false || (!preset && !row.name)) {
    return null;
  }
  const reminderAt = reminderAtSchema.safeParse(row.reminderAt);
  return {
    id: row.id,
    name: row.name,
    preset: preset?.data ?? null,
    schedule,
    reminderAt: reminderAt.success ? reminderAt.data : null,
    archived: row.archivedAt !== null,
    createdAt: row.createdAt.getTime(),
  };
};

export const createHabitRepository = (db: UserDb): HabitRepository => ({
  seedDefaults: async (at) => {
    const seeded = await db
      .select({ id: habitSeeds.id })
      .from(habitSeeds)
      .where(eq(habitSeeds.id, SEED_ID))
      .get();
    if (seeded) {
      return;
    }
    // Defaults first: if the app stops before the marker is written, the
    // next run inserts the same ids again, which changes nothing.
    await db
      .insert(habits)
      .values(
        DEFAULT_HABITS.map((habit, order) => ({
          id: habit.id,
          name: null,
          preset: habit.preset,
          schedule: JSON.stringify(serialiseHabitSchedule(habit.schedule)),
          reminderAt: habit.reminderAt,
          archivedAt: null,
          // Keeps the defaults in their listed order.
          createdAt: new Date(at.getTime() + order),
        }))
      )
      .onConflictDoNothing();
    await db
      .insert(habitSeeds)
      .values({ id: SEED_ID, seededAt: at })
      .onConflictDoNothing();
  },
  list: async () => {
    const rows = await db
      .select()
      .from(habits)
      .orderBy(asc(habits.createdAt), asc(habits.id))
      .all();
    return rows.flatMap((row) => toHabit(row) ?? []);
  },
  create: async (id, draft, at) => {
    const parsed = draftSchema.parse({ id, ...draft });
    const schedule = JSON.stringify(serialiseHabitSchedule(draft.schedule));
    const row = {
      ...parsed,
      preset: null,
      schedule,
      archivedAt: null,
      createdAt: at,
    };
    const habit = toHabit(row);
    if (!habit) {
      throw new Error("The Habit's schedule is not valid");
    }
    await db.insert(habits).values(row);
    return habit;
  },
  setArchived: async (id, archived, at) => {
    await db
      .update(habits)
      .set({ archivedAt: archived ? at : null })
      .where(eq(habits.id, id));
  },
  remove: async (id) => {
    await db.delete(habitCompletions).where(eq(habitCompletions.habitId, id));
    await db.delete(habits).where(eq(habits.id, id));
  },
  setCompleted: async ({ habitId, date, completed, today, at }) => {
    if (Temporal.PlainDate.compare(date, today) > 0) {
      throw new FutureHabitDateError(date);
    }
    const day = date.toString();
    const id = `${habitId}:${day}`;
    await (completed
      ? db
          .insert(habitCompletions)
          .values({ id, habitId, date: day, completedAt: at })
          .onConflictDoNothing()
      : db.delete(habitCompletions).where(eq(habitCompletions.id, id)));
  },
  completions: async () => {
    const rows = await db
      .select({
        habitId: habitCompletions.habitId,
        date: habitCompletions.date,
      })
      .from(habitCompletions)
      .orderBy(asc(habitCompletions.date), asc(habitCompletions.habitId))
      .all();
    return rows.map(({ habitId, date }) => ({
      habitId,
      date: Temporal.PlainDate.from(date),
    }));
  },
});
