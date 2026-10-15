import { FutureHabitDateError } from "@alrisali/domain/habits";
import { sql } from "drizzle-orm";
import { Temporal } from "temporal-polyfill";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { openUserDatabase } from "../shared";
import type { UserDatabase } from "../shared";
import { connectNode, temporaryDirectory } from "../shared/testing";
import type { TemporaryDirectory } from "../shared/testing";
import { createHabitRepository } from "./repository";
import type { HabitRepository } from "./repository";

const TODAY = Temporal.PlainDate.from("2026-10-15");
const YESTERDAY = Temporal.PlainDate.from("2026-10-14");
const AT = new Date("2026-10-15T09:00:00.000Z");
const LATER = new Date("2026-10-16T09:00:00.000Z");
const WALK_ID = "1b9d6bcd-bbfd-4b2d-9b5d-ab8dfbbd4bed";
const FAST_ID = "6ec0bd7f-11c0-43da-975e-2a8ad9ebae0b";

let directory: TemporaryDirectory;
let database: UserDatabase;

const launch = (): Promise<UserDatabase> =>
  openUserDatabase({
    path: `${directory.path}/believer.db`,
    remoteUrl: () => null,
    connect: connectNode,
  });

const listedIds = async (repository: HabitRepository): Promise<string[]> => {
  const listed = await repository.list();
  return listed.map(({ id }) => id);
};

const archivedFlags = async (
  repository: HabitRepository
): Promise<boolean[]> => {
  const listed = await repository.list();
  return listed.map(({ archived }) => archived);
};

const walk = {
  name: "  Evening walk ",
  schedule: { kind: "weekdays", weekdays: [5, 1] },
  reminderAt: 18 * 60,
} as const;

describe(createHabitRepository, () => {
  beforeEach(async () => {
    directory = temporaryDirectory();
    database = await launch();
  });

  afterEach(async () => {
    await database.close();
    directory.remove();
  });

  describe("default Habits", () => {
    it("are seeded in order on first use", async () => {
      const repository = createHabitRepository(database.db);
      await repository.seedDefaults(AT);

      const listed = await repository.list();
      expect(listed.map(({ id }) => id)).toStrictEqual([
        "default:quran-page",
        "default:morning-adhkar",
        "default:evening-adhkar",
        "default:drink-water",
      ]);
      expect(listed[0]).toStrictEqual({
        id: "default:quran-page",
        name: null,
        preset: "quran-page",
        schedule: { kind: "daily" },
        reminderAt: null,
        archived: false,
        createdAt: AT.getTime(),
      });
    });

    it("are seeded exactly once: a deleted default never comes back, even after a relaunch", async () => {
      const repository = createHabitRepository(database.db);
      await repository.seedDefaults(AT);
      await repository.seedDefaults(AT);
      await expect(repository.list()).resolves.toHaveLength(4);

      await repository.remove("default:drink-water");
      await database.close();
      database = await launch();
      const relaunched = createHabitRepository(database.db);
      await relaunched.seedDefaults(LATER);

      await expect(listedIds(relaunched)).resolves.toStrictEqual([
        "default:quran-page",
        "default:morning-adhkar",
        "default:evening-adhkar",
      ]);
    });

    it("seeding twice at once still makes one of each", async () => {
      const repository = createHabitRepository(database.db);
      await Promise.all([
        repository.seedDefaults(AT),
        repository.seedDefaults(AT),
      ]);
      await expect(repository.list()).resolves.toHaveLength(4);
    });
  });

  it("creates a Habit, trimming its name and keeping its schedule and Reminder", async () => {
    const repository = createHabitRepository(database.db);
    const created = await repository.create(WALK_ID, walk, AT);
    const expected = {
      id: WALK_ID,
      name: "Evening walk",
      preset: null,
      schedule: { kind: "weekdays", weekdays: [1, 5] },
      reminderAt: 18 * 60,
      archived: false,
      createdAt: AT.getTime(),
    };
    expect(created).toStrictEqual(expected);

    await database.close();
    database = await launch();
    await expect(
      createHabitRepository(database.db).list()
    ).resolves.toStrictEqual([expected]);
  });

  it("creates a once Habit without a Reminder", async () => {
    const repository = createHabitRepository(database.db);
    await repository.create(
      FAST_ID,
      {
        name: "Fast",
        schedule: { kind: "once", date: TODAY },
        reminderAt: null,
      },
      AT
    );
    const [habit] = await repository.list();
    expect(habit?.schedule).toStrictEqual({ kind: "once", date: TODAY });
    expect(habit?.reminderAt).toBeNull();
  });

  it("refuses an empty name, a bad Reminder time or no weekdays", async () => {
    const repository = createHabitRepository(database.db);
    const drafts = [
      { ...walk, name: "   " },
      { ...walk, reminderAt: 24 * 60 },
      { ...walk, schedule: { kind: "weekdays", weekdays: [] } as const },
    ];
    await Promise.all(
      drafts.map((draft) =>
        expect(repository.create(WALK_ID, draft, AT)).rejects.toBeInstanceOf(
          Error
        )
      )
    );
    await expect(repository.list()).resolves.toStrictEqual([]);
  });

  it("archives and restores a Habit", async () => {
    const repository = createHabitRepository(database.db);
    await repository.create(WALK_ID, walk, AT);
    await repository.setArchived(WALK_ID, true, LATER);
    await expect(archivedFlags(repository)).resolves.toStrictEqual([true]);
    await repository.setArchived(WALK_ID, false, LATER);
    await expect(archivedFlags(repository)).resolves.toStrictEqual([false]);
  });

  it("ticks and un-ticks a Habit per date, once per date", async () => {
    const repository = createHabitRepository(database.db);
    await repository.create(WALK_ID, walk, AT);
    const tick = { habitId: WALK_ID, today: TODAY, at: AT };
    await repository.setCompleted({ ...tick, date: TODAY, completed: true });
    await repository.setCompleted({ ...tick, date: TODAY, completed: true });
    await repository.setCompleted({
      ...tick,
      date: YESTERDAY,
      completed: true,
    });
    await expect(repository.completions()).resolves.toStrictEqual([
      { habitId: WALK_ID, date: YESTERDAY },
      { habitId: WALK_ID, date: TODAY },
    ]);

    await repository.setCompleted({ ...tick, date: TODAY, completed: false });
    await expect(repository.completions()).resolves.toStrictEqual([
      { habitId: WALK_ID, date: YESTERDAY },
    ]);
  });

  it("refuses a tick for a future date", async () => {
    const repository = createHabitRepository(database.db);
    await expect(
      repository.setCompleted({
        habitId: WALK_ID,
        date: TODAY.add({ days: 1 }),
        completed: true,
        today: TODAY,
        at: AT,
      })
    ).rejects.toThrow(FutureHabitDateError);
    await expect(repository.completions()).resolves.toStrictEqual([]);
  });

  it("deletes a Habit with its completions, leaving others", async () => {
    const repository = createHabitRepository(database.db);
    await repository.create(WALK_ID, walk, AT);
    await repository.create(FAST_ID, { ...walk, name: "Fast" }, LATER);
    await Promise.all(
      [WALK_ID, FAST_ID].map((habitId) =>
        repository.setCompleted({
          habitId,
          date: TODAY,
          completed: true,
          today: TODAY,
          at: AT,
        })
      )
    );

    await repository.remove(WALK_ID);

    await expect(listedIds(repository)).resolves.toStrictEqual([FAST_ID]);
    await expect(repository.completions()).resolves.toStrictEqual([
      { habitId: FAST_ID, date: TODAY },
    ]);
  });

  it("skips a Habit synced from a newer app with a schedule it does not know", async () => {
    const repository = createHabitRepository(database.db);
    await repository.create(WALK_ID, walk, AT);
    await database.db.run(
      sql`INSERT INTO habits (id, name, schedule, created_at) VALUES ('future', 'Later', '{"kind":"monthly"}', 0)`
    );
    await expect(listedIds(repository)).resolves.toStrictEqual([WALK_ID]);
  });
});
