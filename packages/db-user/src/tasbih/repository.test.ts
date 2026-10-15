import { randomUUID } from "node:crypto";

import {
  TASBIH_AL_ZAHRA_ID,
  TasbihAlZahraIsPermanentError,
} from "@alrisali/domain/tasbih";
import { sql } from "drizzle-orm";
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

    await expect(
      tasbih.editOpenTasbih(TASBIH_AL_ZAHRA_ID, { name: "Mine", target: null })
    ).rejects.toThrow(TasbihAlZahraIsPermanentError);
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

  it("creates Open Tasbih with a name, target and notes, after Tasbih al-Zahra, by name", async () => {
    const tasbih = createTasbihRepository(database.db);

    const salawat = await tasbih.createOpenTasbih("open-1", {
      name: " Salawat ",
      target: 100,
      notes: "After Fajr",
    });
    await tasbih.createOpenTasbih("open-2", {
      name: "Istighfar",
      target: null,
    });
    await relaunch();

    expect(salawat).toStrictEqual({
      id: "open-1",
      kind: "open",
      name: "Salawat",
      target: 100,
      notes: "After Fajr",
      count: 0,
    });
    await expect(
      createTasbihRepository(database.db).list()
    ).resolves.toStrictEqual([
      {
        id: TASBIH_AL_ZAHRA_ID,
        kind: "tasbih-al-zahra",
        progress: { step: 0, count: 0 },
      },
      {
        id: "open-2",
        kind: "open",
        name: "Istighfar",
        target: null,
        notes: null,
        count: 0,
      },
      salawat,
    ]);
  });

  it("rejects an Open Tasbih with no name or a target of zero", async () => {
    const tasbih = createTasbihRepository(database.db);

    await expect(
      tasbih.createOpenTasbih("open-1", { name: "  ", target: null })
    ).rejects.toThrow("name");
    await expect(
      tasbih.createOpenTasbih("open-1", { name: "Salawat", target: 0 })
    ).rejects.toThrow("target");
    await expect(tasbih.list()).resolves.toHaveLength(1);
  });

  it("edits an Open Tasbih's name, target and notes, and keeps its count", async () => {
    const tasbih = createTasbihRepository(database.db);
    await tasbih.createOpenTasbih("open-1", {
      name: "Salawat",
      target: 100,
      notes: "After Fajr",
    });
    await tasbih.saveOpenTasbihCount("open-1", 12);

    await tasbih.editOpenTasbih("open-1", { name: "Salawat 2", target: null });

    await expect(tasbih.getOpenTasbih("open-1")).resolves.toStrictEqual({
      id: "open-1",
      kind: "open",
      name: "Salawat 2",
      target: null,
      notes: null,
      count: 12,
    });
  });

  it("keeps an Open Tasbih's count across a relaunch", async () => {
    await createTasbihRepository(database.db).createOpenTasbih("open-1", {
      name: "Salawat",
      target: null,
    });
    await createTasbihRepository(database.db).saveOpenTasbihCount("open-1", 7);

    await relaunch();

    await expect(
      createTasbihRepository(database.db).getOpenTasbih("open-1")
    ).resolves.toMatchObject({ count: 7 });
  });

  it("finds no Open Tasbih for an unknown id or for Tasbih al-Zahra", async () => {
    const tasbih = createTasbihRepository(database.db);
    await tasbih.saveTasbihAlZahraProgress({ step: 1, count: 3 });

    await expect(tasbih.getOpenTasbih("missing")).resolves.toBeNull();
    await expect(tasbih.getOpenTasbih(TASBIH_AL_ZAHRA_ID)).resolves.toBeNull();
  });

  it("saves an Open Tasbih's count as a Dhikr Session and starts it again", async () => {
    const tasbih = createTasbihRepository(database.db);
    await tasbih.createOpenTasbih("open-1", { name: "Salawat", target: 33 });
    await tasbih.saveOpenTasbihCount("open-1", 40);
    const session = {
      id: randomUUID(),
      tasbihId: "open-1",
      count: 40,
      completedAt: Date.UTC(2026, 9, 15, 18, 0),
    };

    await expect(tasbih.saveOpenTasbihSession(session)).resolves.toStrictEqual(
      session
    );

    await expect(tasbih.listDhikrSessions()).resolves.toStrictEqual([session]);
    await expect(tasbih.getOpenTasbih("open-1")).resolves.toMatchObject({
      count: 0,
    });
  });

  it("records no Dhikr Session when the Open Tasbih cannot start again", async () => {
    const tasbih = createTasbihRepository(database.db);
    await tasbih.createOpenTasbih("open-1", { name: "Salawat", target: 33 });
    await tasbih.saveOpenTasbihCount("open-1", 40);
    // Every later count change fails, as a failing write on the device would.
    await database.db.run(
      sql.raw(
        "CREATE TRIGGER refuse_count BEFORE UPDATE ON tasbih BEGIN SELECT RAISE(ABORT, 'refused'); END"
      )
    );

    await expect(
      tasbih.saveOpenTasbihSession({
        id: randomUUID(),
        tasbihId: "open-1",
        count: 40,
        completedAt: Date.UTC(2026, 9, 15, 18, 0),
      })
    ).rejects.toThrow(/Failed query: update "tasbih"/u);

    await expect(tasbih.listDhikrSessions()).resolves.toStrictEqual([]);
    await expect(tasbih.getOpenTasbih("open-1")).resolves.toMatchObject({
      count: 40,
    });
  });

  it("deletes an Open Tasbih and keeps its Dhikr Sessions", async () => {
    const tasbih = createTasbihRepository(database.db);
    await tasbih.createOpenTasbih("open-1", { name: "Salawat", target: null });
    const session = {
      id: randomUUID(),
      tasbihId: "open-1",
      count: 5,
      completedAt: Date.now(),
    };
    await tasbih.saveOpenTasbihSession(session);

    await tasbih.remove("open-1");

    await expect(tasbih.list()).resolves.toHaveLength(1);
    await expect(tasbih.listDhikrSessions()).resolves.toStrictEqual([session]);
  });
});
