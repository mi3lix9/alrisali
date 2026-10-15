import { XP_FOR } from "@alrisali/domain/companion";
import type { XpEvent } from "@alrisali/domain/companion";
import { sql } from "drizzle-orm";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { connectNode, temporaryDirectory } from "../shared/testing";
import type { TemporaryDirectory } from "../shared/testing";
import { openUserDatabase } from "../shared/user-database";
import type { UserDatabase } from "../shared/user-database";
import { createCompanionRepository } from "./repository";

const FAJR: XpEvent = { kind: "salah", date: "2026-10-16", salah: "fajr" };
const LESSON: XpEvent = { kind: "lesson", lessonId: "aqeedah-1" };
const NOW = new Date("2026-10-16T05:00:00.000Z");

let directory: TemporaryDirectory;
let database: UserDatabase;

const launch = (): Promise<UserDatabase> =>
  openUserDatabase({
    path: `${directory.path}/believer.db`,
    remoteUrl: () => null,
    connect: connectNode,
  });

describe(createCompanionRepository, () => {
  beforeEach(async () => {
    directory = temporaryDirectory();
    database = await launch();
  });

  afterEach(async () => {
    await database.close();
    directory.remove();
  });

  it("starts a Traveler with no XP", async () => {
    await expect(
      createCompanionRepository(database.db).companion()
    ).resolves.toStrictEqual({ xp: 0, theme: "traveler" });
  });

  it("awards an event's XP and reports the total before and after", async () => {
    const companion = createCompanionRepository(database.db, () => NOW);

    await expect(companion.award(FAJR)).resolves.toStrictEqual({
      awarded: true,
      before: 0,
      after: XP_FOR.salah,
    });
    await expect(companion.award(LESSON)).resolves.toStrictEqual({
      awarded: true,
      before: XP_FOR.salah,
      after: XP_FOR.salah + XP_FOR.lesson,
    });
  });

  it("awards each event once, even when it is heard again after a relaunch", async () => {
    await createCompanionRepository(database.db).award(FAJR);
    await expect(
      createCompanionRepository(database.db).award({ ...FAJR })
    ).resolves.toStrictEqual({
      awarded: false,
      before: XP_FOR.salah,
      after: XP_FOR.salah,
    });

    await database.close();
    database = await launch();
    const companion = createCompanionRepository(database.db);
    await expect(companion.award(FAJR)).resolves.toMatchObject({
      awarded: false,
    });
    await expect(companion.companion()).resolves.toMatchObject({
      xp: XP_FOR.salah,
    });
  });

  it("awards the same Salah on another day, and another Salah the same day", async () => {
    const companion = createCompanionRepository(database.db);
    await companion.award(FAJR);
    await companion.award({ ...FAJR, date: "2026-10-17" });
    await companion.award({ ...FAJR, salah: "dhuhr" });

    await expect(companion.companion()).resolves.toMatchObject({
      xp: XP_FOR.salah * 3,
    });
  });

  it("awards concurrent repeats of one event once", async () => {
    const companion = createCompanionRepository(database.db);
    const results = await Promise.all([
      companion.award(FAJR),
      companion.award(FAJR),
    ]);

    expect(results.filter((result) => result.awarded)).toHaveLength(1);
    await expect(companion.companion()).resolves.toMatchObject({
      xp: XP_FOR.salah,
    });
  });

  it("rejects a malformed event and awards nothing", async () => {
    const companion = createCompanionRepository(database.db);
    await expect(
      companion.award({ kind: "habit", habitId: "", date: "2026-10-16" })
    ).rejects.toThrow("habitId");
    await expect(companion.companion()).resolves.toMatchObject({ xp: 0 });
  });

  it("keeps the chosen theme across a relaunch", async () => {
    await createCompanionRepository(database.db).setTheme("garden");
    await database.close();
    database = await launch();

    await expect(
      createCompanionRepository(database.db).companion()
    ).resolves.toMatchObject({ theme: "garden" });
  });

  it("counts XP of a kind this app does not know (awarded by a newer app)", async () => {
    const companion = createCompanionRepository(database.db);
    await companion.award(FAJR);
    await database.db.run(
      sql`INSERT INTO companion_xp_awards (id, kind, xp, awarded_at)
          VALUES ('fast:2026-10-16', 'fast', 15, ${NOW.getTime()})`
    );

    await expect(companion.companion()).resolves.toMatchObject({
      xp: XP_FOR.salah + 15,
    });
  });

  it("falls back to the Traveler for a theme this app does not know", async () => {
    const companion = createCompanionRepository(database.db);
    await companion.setTheme("garden");
    await database.db.run(sql`UPDATE companion SET theme = 'river'`);

    await expect(companion.companion()).resolves.toMatchObject({
      theme: "traveler",
    });
  });
});
