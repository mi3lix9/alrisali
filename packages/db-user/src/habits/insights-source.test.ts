import { sql } from "drizzle-orm";
import { Temporal } from "temporal-polyfill";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { connectNode, temporaryDirectory } from "../shared/testing";
import type { TemporaryDirectory } from "../shared/testing";
import { openUserDatabase } from "../shared/user-database";
import type { UserDatabase } from "../shared/user-database";
import {
  readHabitCompletionsInsightsSource,
  readHabitsInsightsSource,
} from "./insights-source";

const BAGHDAD = "Asia/Baghdad";
const date = (iso: string) => Temporal.PlainDate.from(iso);
// 2026-10-14 22:30 UTC is already 2026-10-15 01:30 in Baghdad.
const LATE_EVENING_UTC = Date.UTC(2026, 9, 14, 22, 30);
const NOON_UTC = Date.UTC(2026, 9, 14, 12);

let directory: TemporaryDirectory;
let database: UserDatabase;

describe(readHabitsInsightsSource, () => {
  beforeEach(async () => {
    directory = temporaryDirectory();
    // A Guest's database: no sync server, so this is fully offline.
    database = await openUserDatabase({
      path: `${directory.path}/believer.db`,
      remoteUrl: () => null,
      connect: connectNode,
    });
  });

  afterEach(async () => {
    await database.close();
    directory.remove();
  });

  it("reads nothing from a new Guest's database", async () => {
    await expect(
      readHabitsInsightsSource(database.db, BAGHDAD)
    ).resolves.toStrictEqual([]);
  });

  it("reads Habits, created on their local date", async () => {
    await database.db.run(
      sql`INSERT INTO habits (id, name, preset, schedule, reminder_at, archived_at, created_at) VALUES
          ('default:drink-water', NULL, 'drink-water', '{"kind":"daily"}', NULL, NULL, ${LATE_EVENING_UTC}),
          ('own', 'Charity', NULL, '{"kind":"weekdays","weekdays":[5,1]}', 540, ${NOON_UTC}, ${NOON_UTC}),
          ('newer', 'From a newer app', NULL, '{"kind":"monthly"}', NULL, NULL, ${NOON_UTC})`
    );

    await expect(
      readHabitsInsightsSource(database.db, BAGHDAD)
    ).resolves.toStrictEqual([
      {
        id: "own",
        name: "Charity",
        preset: null,
        schedule: { kind: "weekdays", weekdays: [1, 5] },
        archived: true,
        createdOn: date("2026-10-14"),
      },
      {
        id: "default:drink-water",
        name: null,
        preset: "drink-water",
        schedule: { kind: "daily" },
        archived: false,
        createdOn: date("2026-10-15"),
      },
    ]);
  });
});

describe(readHabitCompletionsInsightsSource, () => {
  beforeEach(async () => {
    directory = temporaryDirectory();
    database = await openUserDatabase({
      path: `${directory.path}/believer.db`,
      remoteUrl: () => null,
      connect: connectNode,
    });
  });

  afterEach(async () => {
    await database.close();
    directory.remove();
  });

  it("reads Habit completions by date", async () => {
    await database.db.run(
      sql`INSERT INTO habit_completions (id, habit_id, date, completed_at) VALUES
          ('own:2026-10-13', 'own', '2026-10-13', ${NOON_UTC}),
          ('own:2026-10-12', 'own', '2026-10-12', ${NOON_UTC})`
    );

    await expect(
      readHabitCompletionsInsightsSource(database.db, BAGHDAD)
    ).resolves.toStrictEqual([
      { habitId: "own", date: date("2026-10-12") },
      { habitId: "own", date: date("2026-10-13") },
    ]);
  });
});
