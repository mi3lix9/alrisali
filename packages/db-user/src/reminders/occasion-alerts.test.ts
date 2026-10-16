import { sql } from "drizzle-orm";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { openUserDatabase } from "../shared";
import type { UserDatabase } from "../shared";
import { connectNode, temporaryDirectory } from "../shared/testing";
import type { TemporaryDirectory } from "../shared/testing";
import { createOccasionAlertSettingsRepository } from "./occasion-alerts";

let directory: TemporaryDirectory;
let database: UserDatabase;

const launch = (): Promise<UserDatabase> =>
  openUserDatabase({
    path: `${directory.path}/believer.db`,
    remoteUrl: () => null,
    connect: connectNode,
  });

describe(createOccasionAlertSettingsRepository, () => {
  beforeEach(async () => {
    directory = temporaryDirectory();
    database = await launch();
  });

  afterEach(async () => {
    await database.close();
    directory.remove();
  });

  it("starts off with every type", async () => {
    const repository = createOccasionAlertSettingsRepository(database.db);

    await expect(repository.get()).resolves.toStrictEqual({
      enabled: false,
      timing: "day-of",
      time: 480,
      types: ["celebration", "mourning", "religious", "fasting"],
    });
  });

  it("keeps the type filter, timing and time across launches", async () => {
    await createOccasionAlertSettingsRepository(database.db).update({
      enabled: true,
      timing: "evening-before",
      time: 1200,
      types: ["mourning"],
    });
    await database.close();
    database = await launch();

    await expect(
      createOccasionAlertSettingsRepository(database.db).get()
    ).resolves.toStrictEqual({
      enabled: true,
      timing: "evening-before",
      time: 1200,
      types: ["mourning"],
    });
  });

  it("rejects an invalid time and reads a broken row as defaults", async () => {
    const repository = createOccasionAlertSettingsRepository(database.db);
    await expect(repository.update({ time: 5000 })).rejects.toThrow("1439");

    await repository.update({ enabled: true });
    await database.db.run(
      sql`UPDATE occasion_alert_settings SET types = 'not json', timing = 'x'`
    );
    await expect(repository.get()).resolves.toMatchObject({
      enabled: true,
      timing: "day-of",
      types: ["celebration", "mourning", "religious", "fasting"],
    });
  });
});
