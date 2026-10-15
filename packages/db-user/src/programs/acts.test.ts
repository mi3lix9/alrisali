import { FutureActDateError } from "@alrisali/domain/programs";
import { Temporal } from "temporal-polyfill";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { connectNode, temporaryDirectory } from "../shared/testing";
import type { TemporaryDirectory } from "../shared/testing";
import { openUserDatabase } from "../shared/user-database";
import type { UserDatabase } from "../shared/user-database";
import {
  createActCompletionsRepository,
  createSeenProgramsRepository,
} from "./acts";

const TODAY = Temporal.PlainDate.from("2026-10-15");
const YESTERDAY = Temporal.PlainDate.from("2026-10-14");
const AT = new Date("2026-10-15T09:00:00.000Z");

let directory: TemporaryDirectory;
let database: UserDatabase;

const launch = (): Promise<UserDatabase> =>
  openUserDatabase({
    path: `${directory.path}/believer.db`,
    remoteUrl: () => null,
    connect: connectNode,
  });

const tick = {
  programId: "nawafil",
  actId: "night-prayer",
  today: TODAY,
  at: AT,
};

describe("Act Completions and seen Programs", () => {
  beforeEach(async () => {
    directory = temporaryDirectory();
    database = await launch();
  });

  afterEach(async () => {
    await database.close();
    directory.remove();
  });

  describe(createActCompletionsRepository, () => {
    it("keeps an Act Completion per Act and date across a relaunch; ticking twice keeps one", async () => {
      const repository = createActCompletionsRepository(database.db);
      await repository.setCompleted({ ...tick, date: TODAY, completed: true });
      await repository.setCompleted({ ...tick, date: TODAY, completed: true });
      await repository.setCompleted({
        ...tick,
        date: YESTERDAY,
        completed: true,
      });
      await repository.setCompleted({
        ...tick,
        actId: "morning-dua",
        date: TODAY,
        completed: true,
      });
      await database.close();
      database = await launch();

      const relaunched = createActCompletionsRepository(database.db);
      await expect(relaunched.completions()).resolves.toStrictEqual([
        { programId: "nawafil", actId: "night-prayer", date: YESTERDAY },
        { programId: "nawafil", actId: "morning-dua", date: TODAY },
        { programId: "nawafil", actId: "night-prayer", date: TODAY },
      ]);
      await expect(relaunched.completionsOn(TODAY)).resolves.toStrictEqual([
        { programId: "nawafil", actId: "morning-dua", date: TODAY },
        { programId: "nawafil", actId: "night-prayer", date: TODAY },
      ]);
    });

    it("undoes an Act Completion for that date only", async () => {
      const repository = createActCompletionsRepository(database.db);
      await repository.setCompleted({ ...tick, date: TODAY, completed: true });
      await repository.setCompleted({
        ...tick,
        date: YESTERDAY,
        completed: true,
      });

      await repository.setCompleted({ ...tick, date: TODAY, completed: false });

      await expect(repository.completions()).resolves.toStrictEqual([
        { programId: "nawafil", actId: "night-prayer", date: YESTERDAY },
      ]);
    });

    it("refuses an Act Completion for a future date and saves nothing", async () => {
      const repository = createActCompletionsRepository(database.db);

      await expect(
        repository.setCompleted({
          ...tick,
          date: TODAY.add({ days: 1 }),
          completed: true,
        })
      ).rejects.toBeInstanceOf(FutureActDateError);
      await expect(repository.completions()).resolves.toStrictEqual([]);
    });

    it("keeps the same Act in two Programs apart", async () => {
      const repository = createActCompletionsRepository(database.db);
      await repository.setCompleted({ ...tick, date: TODAY, completed: true });
      await repository.setCompleted({
        ...tick,
        programId: "ramadan",
        date: TODAY,
        completed: true,
      });
      await repository.setCompleted({ ...tick, date: TODAY, completed: false });

      await expect(repository.completionsOn(TODAY)).resolves.toStrictEqual([
        { programId: "ramadan", actId: "night-prayer", date: TODAY },
      ]);
    });
  });

  describe(createSeenProgramsRepository, () => {
    it("remembers which Programs the Believer opened, across a relaunch", async () => {
      const repository = createSeenProgramsRepository(database.db);
      await expect(repository.seenIds()).resolves.toStrictEqual(new Set());

      await repository.markSeen("nawafil", AT);
      await repository.markSeen("nawafil", AT);
      await repository.markSeen("ramadan", AT);
      await database.close();
      database = await launch();

      await expect(
        createSeenProgramsRepository(database.db).seenIds()
      ).resolves.toStrictEqual(new Set(["nawafil", "ramadan"]));
    });
  });
});
