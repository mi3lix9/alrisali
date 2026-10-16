import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { openUserDatabase } from "../shared";
import type { UserDatabase } from "../shared";
import { connectNode, temporaryDirectory } from "../shared/testing";
import type { TemporaryDirectory } from "../shared/testing";
import { tasbihSettings } from "./schema";
import { createTasbihSettingsRepository } from "./settings";

let directory: TemporaryDirectory;
let database: UserDatabase;

const launch = (): Promise<UserDatabase> =>
  openUserDatabase({
    path: `${directory.path}/believer.db`,
    remoteUrl: () => null,
    connect: connectNode,
  });

describe(createTasbihSettingsRepository, () => {
  beforeEach(async () => {
    directory = temporaryDirectory();
    database = await launch();
  });

  afterEach(async () => {
    await database.close();
    directory.remove();
  });

  it("starts on haptic only", async () => {
    await expect(
      createTasbihSettingsRepository(database.db).settings()
    ).resolves.toStrictEqual({ feedbackMode: "haptic" });
  });

  it("keeps the chosen feedback mode across a relaunch", async () => {
    await expect(
      createTasbihSettingsRepository(database.db).update({
        feedbackMode: "silent",
      })
    ).resolves.toStrictEqual({ feedbackMode: "silent" });

    await database.close();
    database = await launch();

    await expect(
      createTasbihSettingsRepository(database.db).settings()
    ).resolves.toStrictEqual({ feedbackMode: "silent" });
  });

  it("refuses a feedback mode this app does not know", async () => {
    await expect(
      createTasbihSettingsRepository(database.db).update({
        // @ts-expect-error: an unknown mode, as an older or newer app might send.
        feedbackMode: "loud",
      })
    ).rejects.toThrow(/feedbackMode/u);
  });

  it("reads a mode synced from a newer app as the default", async () => {
    await database.db
      .insert(tasbihSettings)
      .values({ id: "believer", feedbackMode: "chime-only" });

    await expect(
      createTasbihSettingsRepository(database.db).settings()
    ).resolves.toStrictEqual({ feedbackMode: "haptic" });
  });
});
