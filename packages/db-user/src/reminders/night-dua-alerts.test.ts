import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { openUserDatabase } from "../shared";
import type { UserDatabase } from "../shared";
import { connectNode, temporaryDirectory } from "../shared/testing";
import type { TemporaryDirectory } from "../shared/testing";
import { createNightDuaAlertsRepository } from "./night-dua-alerts";

let directory: TemporaryDirectory;
let database: UserDatabase;

const launch = (): Promise<UserDatabase> =>
  openUserDatabase({
    path: `${directory.path}/believer.db`,
    remoteUrl: () => null,
    connect: connectNode,
  });

describe(createNightDuaAlertsRepository, () => {
  beforeEach(async () => {
    directory = temporaryDirectory();
    database = await launch();
  });

  afterEach(async () => {
    await database.close();
    directory.remove();
  });

  it("has every night-dua alert off until the Believer turns one on", async () => {
    const alerts = createNightDuaAlertsRepository(database.db);

    await expect(alerts.get()).resolves.toStrictEqual({
      kumayl: false,
      tawassul: false,
      nudba: false,
      ziyarah: false,
    });
  });

  it("turns one on without touching the others, and keeps it across launches", async () => {
    await createNightDuaAlertsRepository(database.db).update({ kumayl: true });
    await database.close();
    database = await launch();

    await expect(
      createNightDuaAlertsRepository(database.db).get()
    ).resolves.toStrictEqual({
      kumayl: true,
      tawassul: false,
      nudba: false,
      ziyarah: false,
    });
  });
});
