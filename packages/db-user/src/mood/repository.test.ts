import { sql } from "drizzle-orm";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { connectNode, temporaryDirectory } from "../shared/testing";
import type { TemporaryDirectory } from "../shared/testing";
import { openUserDatabase } from "../shared/user-database";
import type { UserDatabase } from "../shared/user-database";
import { createMoodCheckInRepository } from "./repository";
import type { MoodCheckIn } from "./repository";

const MORNING: MoodCheckIn = {
  id: "0b6f1c1e-3a43-4c38-9a9e-6f0c3c2b8a10",
  mood: "sad",
  remedyId: "sad-hardship-ease",
  checkedInAt: new Date("2026-10-15T06:30:00.000Z"),
};

const EVENING: MoodCheckIn = {
  id: "5d1f6a2b-7c8e-4f90-8a1b-2c3d4e5f6a7b",
  mood: "calm",
  remedyId: "calm-hearts-at-rest",
  checkedInAt: new Date("2026-10-15T18:45:00.000Z"),
};

let directory: TemporaryDirectory;
let database: UserDatabase;

const launch = (): Promise<UserDatabase> =>
  openUserDatabase({
    path: `${directory.path}/believer.db`,
    remoteUrl: () => null,
    connect: connectNode,
  });

describe(createMoodCheckInRepository, () => {
  beforeEach(async () => {
    directory = temporaryDirectory();
    database = await launch();
  });

  afterEach(async () => {
    await database.close();
    directory.remove();
  });

  it("has no Mood Check-in before the first one", async () => {
    await expect(
      createMoodCheckInRepository(database.db).latest()
    ).resolves.toBeNull();
  });

  it("keeps a Mood Check-in and its Remedy across a relaunch", async () => {
    await expect(
      createMoodCheckInRepository(database.db).record(MORNING)
    ).resolves.toStrictEqual(MORNING);

    await database.close();
    database = await launch();

    await expect(
      createMoodCheckInRepository(database.db).latest()
    ).resolves.toStrictEqual(MORNING);
  });

  it("gives the most recent Mood Check-in, whatever order they were saved in", async () => {
    const checkIns = createMoodCheckInRepository(database.db);
    await checkIns.record(EVENING);
    await checkIns.record(MORNING);

    await expect(checkIns.latest()).resolves.toStrictEqual(EVENING);
  });

  it("rejects a Remedy that does not answer the mood, and saves nothing", async () => {
    const checkIns = createMoodCheckInRepository(database.db);

    await expect(
      checkIns.record({ ...MORNING, remedyId: "angry-pardon" })
    ).rejects.toThrow("remedy");
    await expect(
      checkIns.record({ ...MORNING, remedyId: "no-such-remedy" })
    ).rejects.toThrow("remedy");
    await expect(checkIns.latest()).resolves.toBeNull();
  });

  it("rejects an id that cannot stay unique across devices", async () => {
    await expect(
      createMoodCheckInRepository(database.db).record({ ...MORNING, id: "1" })
    ).rejects.toThrow("id");
  });

  it("skips a check-in with a mood this app does not know (written by a newer app)", async () => {
    const checkIns = createMoodCheckInRepository(database.db);
    await checkIns.record(MORNING);
    await database.db.run(
      sql`INSERT INTO mood_check_ins (id, mood, remedy_id, checked_in_at)
          VALUES ('9f8e7d6c-5b4a-4321-8fed-cba987654321', 'grateful', 'grateful-1', ${EVENING.checkedInAt.getTime()})`
    );

    await expect(checkIns.latest()).resolves.toStrictEqual(MORNING);
  });
});
