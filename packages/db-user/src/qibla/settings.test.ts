import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { openUserDatabase } from "../shared";
import type { UserDatabase } from "../shared";
import { connectNode, temporaryDirectory } from "../shared/testing";
import type { TemporaryDirectory } from "../shared/testing";
import { qiblaSettings } from "./schema";
import { createQiblaSettingsRepository } from "./settings";

let directory: TemporaryDirectory;
let database: UserDatabase;

const launch = (): Promise<UserDatabase> =>
  openUserDatabase({
    path: `${directory.path}/believer.db`,
    remoteUrl: () => null,
    connect: connectNode,
  });

describe(createQiblaSettingsRepository, () => {
  beforeEach(async () => {
    directory = temporaryDirectory();
    database = await launch();
  });

  afterEach(async () => {
    await database.close();
    directory.remove();
  });

  it("starts on the Kaaba", async () => {
    await expect(
      createQiblaSettingsRepository(database.db).settings()
    ).resolves.toStrictEqual({ target: "kaaba" });
  });

  it("keeps the chosen Shrine across a relaunch", async () => {
    await expect(
      createQiblaSettingsRepository(database.db).update({ target: "najaf" })
    ).resolves.toStrictEqual({ target: "najaf" });
    await database.close();
    database = await launch();
    await expect(
      createQiblaSettingsRepository(database.db).settings()
    ).resolves.toStrictEqual({ target: "najaf" });
  });

  it("returns to the Kaaba when it is chosen again", async () => {
    const repository = createQiblaSettingsRepository(database.db);
    await repository.update({ target: "mashhad" });
    await repository.update({ target: "kaaba" });
    await expect(repository.settings()).resolves.toStrictEqual({
      target: "kaaba",
    });
  });

  it("refuses a target that isn't one of the seven", async () => {
    await expect(
      createQiblaSettingsRepository(database.db).update({
        target: "atlantis" as "kaaba",
      })
    ).rejects.toThrow(/invalid_value/u);
  });

  it("reads a target from a newer app as the Kaaba", async () => {
    await database.db
      .insert(qiblaSettings)
      .values({ id: "believer", target: "al-aqsa" });
    await expect(
      createQiblaSettingsRepository(database.db).settings()
    ).resolves.toStrictEqual({ target: "kaaba" });
  });
});
