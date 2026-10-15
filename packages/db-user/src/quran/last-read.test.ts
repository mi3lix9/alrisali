import { sql } from "drizzle-orm";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { openUserDatabase } from "../shared";
import type { UserDatabase } from "../shared";
import { connectNode, temporaryDirectory } from "../shared/testing";
import type { TemporaryDirectory } from "../shared/testing";
import { createQuranLastReadRepository } from "./last-read";

let directory: TemporaryDirectory;
let database: UserDatabase;

const launch = (): Promise<UserDatabase> =>
  openUserDatabase({
    path: `${directory.path}/believer.db`,
    remoteUrl: () => null,
    connect: connectNode,
  });

const at = (iso: string) => () => new Date(iso);

describe(createQuranLastReadRepository, () => {
  beforeEach(async () => {
    directory = temporaryDirectory();
    database = await launch();
  });

  afterEach(async () => {
    await database.close();
    directory.remove();
  });

  it("has no Last-Read Ayah before the Believer reads", async () => {
    await expect(
      createQuranLastReadRepository(database.db).get()
    ).resolves.toBeNull();
  });

  it("keeps the latest Last-Read Ayah across a relaunch", async () => {
    await createQuranLastReadRepository(
      database.db,
      at("2026-10-15T10:00:00.000Z")
    ).set("2:255");
    await createQuranLastReadRepository(
      database.db,
      at("2026-10-15T10:05:00.000Z")
    ).set("18:10");

    await database.close();
    database = await launch();

    await expect(
      createQuranLastReadRepository(database.db).get()
    ).resolves.toStrictEqual({
      ayah: "18:10",
      setAt: "2026-10-15T10:05:00.000Z",
    });
  });

  it("refuses an ayah the mushaf does not have", async () => {
    const lastRead = createQuranLastReadRepository(database.db);
    await expect(lastRead.set("114:7")).rejects.toThrow("114:7");
    await expect(lastRead.get()).resolves.toBeNull();
  });

  it("ignores a stored ayah this mushaf does not have", async () => {
    await database.db.run(
      sql`INSERT INTO quran_last_read (id, ayah, set_at) VALUES ('believer', '115:1', '2026-10-15T10:00:00.000Z')`
    );
    await expect(
      createQuranLastReadRepository(database.db).get()
    ).resolves.toBeNull();
  });
});
