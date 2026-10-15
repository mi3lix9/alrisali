import { randomUUID } from "node:crypto";

import {
  TASBIH_AL_ZAHRA_ID,
  TasbihAlZahraIsPermanentError,
} from "@alrisali/domain/tasbih";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { connectNode, temporaryDirectory } from "../shared/testing";
import type { TemporaryDirectory } from "../shared/testing";
import { openUserDatabase } from "../shared/user-database";
import type { UserDatabase } from "../shared/user-database";
import { createTasbihRepository } from "./repository";

let directory: TemporaryDirectory;
let database: UserDatabase;

const launch = (): Promise<UserDatabase> =>
  openUserDatabase({
    path: `${directory.path}/believer.db`,
    remoteUrl: () => null,
    connect: connectNode,
  });

/** Closes the database and opens it again, as an app relaunch does. */
const relaunch = async (): Promise<void> => {
  await database.close();
  database = await launch();
};

describe(createTasbihRepository, () => {
  beforeEach(async () => {
    directory = temporaryDirectory();
    database = await launch();
  });

  afterEach(async () => {
    await database.close();
    directory.remove();
  });

  it("always lists Tasbih al-Zahra first, even on a fresh database", async () => {
    const tasbih = createTasbihRepository(database.db);

    await expect(tasbih.list()).resolves.toStrictEqual([
      {
        id: TASBIH_AL_ZAHRA_ID,
        kind: "tasbih-al-zahra",
        progress: { step: 0, count: 0 },
      },
    ]);
  });

  it("keeps Tasbih al-Zahra's progress across a relaunch", async () => {
    await createTasbihRepository(database.db).saveTasbihAlZahraProgress({
      step: 1,
      count: 12,
    });
    await createTasbihRepository(database.db).saveTasbihAlZahraProgress({
      step: 2,
      count: 5,
    });

    await relaunch();

    await expect(
      createTasbihRepository(database.db).getTasbihAlZahraProgress()
    ).resolves.toStrictEqual({ step: 2, count: 5 });
  });

  it("refuses to rename or delete Tasbih al-Zahra, and keeps it", async () => {
    const tasbih = createTasbihRepository(database.db);
    await tasbih.saveTasbihAlZahraProgress({ step: 1, count: 3 });

    await expect(tasbih.rename(TASBIH_AL_ZAHRA_ID, "Mine")).rejects.toThrow(
      TasbihAlZahraIsPermanentError
    );
    await expect(tasbih.remove(TASBIH_AL_ZAHRA_ID)).rejects.toThrow(
      TasbihAlZahraIsPermanentError
    );

    await expect(tasbih.list()).resolves.toStrictEqual([
      {
        id: TASBIH_AL_ZAHRA_ID,
        kind: "tasbih-al-zahra",
        progress: { step: 1, count: 3 },
      },
    ]);
  });

  it("records Dhikr Sessions and lists them newest first, across a relaunch", async () => {
    const first = {
      id: randomUUID(),
      tasbihId: TASBIH_AL_ZAHRA_ID,
      count: 100,
      completedAt: Date.UTC(2026, 9, 15, 5, 0),
    };
    const second = {
      ...first,
      id: randomUUID(),
      completedAt: first.completedAt + 60_000,
    };
    const tasbih = createTasbihRepository(database.db);

    await expect(tasbih.recordDhikrSession(first)).resolves.toStrictEqual(
      first
    );
    await tasbih.recordDhikrSession(second);
    await relaunch();

    await expect(
      createTasbihRepository(database.db).listDhikrSessions()
    ).resolves.toStrictEqual([second, first]);
  });

  it("rejects a Dhikr Session with no count", async () => {
    const tasbih = createTasbihRepository(database.db);

    await expect(
      tasbih.recordDhikrSession({
        id: randomUUID(),
        tasbihId: TASBIH_AL_ZAHRA_ID,
        count: 0,
        completedAt: Date.now(),
      })
    ).rejects.toThrow("count");
    await expect(tasbih.listDhikrSessions()).resolves.toStrictEqual([]);
  });
});
