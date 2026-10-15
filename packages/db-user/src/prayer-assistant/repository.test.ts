import { sql } from "drizzle-orm";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { openUserDatabase } from "../shared";
import type { UserDatabase } from "../shared";
import { connectNode, temporaryDirectory } from "../shared/testing";
import type { TemporaryDirectory } from "../shared/testing";
import { createPrayerAssistantRepository } from "./repository";

let directory: TemporaryDirectory;
let database: UserDatabase;

const launch = (): Promise<UserDatabase> =>
  openUserDatabase({
    path: `${directory.path}/believer.db`,
    remoteUrl: () => null,
    connect: connectNode,
  });

describe(createPrayerAssistantRepository, () => {
  beforeEach(async () => {
    directory = temporaryDirectory();
    database = await launch();
  });

  afterEach(async () => {
    await database.close();
    directory.remove();
  });

  it("starts at Normal Pace with a tolerant bow", async () => {
    await expect(
      createPrayerAssistantRepository(database.db).settings()
    ).resolves.toStrictEqual({
      pace: "normal",
      custom: { holdMs: 800, tashahhudMs: 3000 },
      bowSensitivity: 70,
    });
  });

  it("keeps the chosen Pace, Custom holds and bow sensitivity across a relaunch", async () => {
    const assistant = createPrayerAssistantRepository(database.db);
    await assistant.update({ pace: "slow" });
    await expect(
      assistant.update({
        pace: "custom",
        custom: { holdMs: 1000, tashahhudMs: 5000 },
        bowSensitivity: 40,
      })
    ).resolves.toStrictEqual({
      pace: "custom",
      custom: { holdMs: 1000, tashahhudMs: 5000 },
      bowSensitivity: 40,
    });

    await database.close();
    database = await launch();

    await expect(
      createPrayerAssistantRepository(database.db).settings()
    ).resolves.toStrictEqual({
      pace: "custom",
      custom: { holdMs: 1000, tashahhudMs: 5000 },
      bowSensitivity: 40,
    });
  });

  it("refuses a Custom hold or bow sensitivity out of range and keeps the saved one", async () => {
    const assistant = createPrayerAssistantRepository(database.db);
    await expect(
      assistant.update({ custom: { holdMs: 100, tashahhudMs: 3000 } })
    ).rejects.toThrow("holdMs");
    await expect(assistant.update({ bowSensitivity: 101 })).rejects.toThrow(
      "bowSensitivity"
    );
    await expect(assistant.settings()).resolves.toStrictEqual({
      pace: "normal",
      custom: { holdMs: 800, tashahhudMs: 3000 },
      bowSensitivity: 70,
    });
  });

  it("reads values a newer app synced as the defaults", async () => {
    await database.db.run(
      sql`INSERT INTO prayer_assistant_settings (id, pace, hold_ms, tashahhud_ms, bow_sensitivity) VALUES ('believer', 'glacial', 99999, 1, 500)`
    );
    await expect(
      createPrayerAssistantRepository(database.db).settings()
    ).resolves.toStrictEqual({
      pace: "normal",
      custom: { holdMs: 800, tashahhudMs: 3000 },
      bowSensitivity: 70,
    });
  });
});
