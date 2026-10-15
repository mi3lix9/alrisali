import { sql } from "drizzle-orm";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { openUserDatabase } from "../shared";
import type { UserDatabase } from "../shared";
import { connectNode, temporaryDirectory } from "../shared/testing";
import type { TemporaryDirectory } from "../shared/testing";
import { createPrayerTimesRepository } from "./repository";

let directory: TemporaryDirectory;
let database: UserDatabase;

const launch = (): Promise<UserDatabase> =>
  openUserDatabase({
    path: `${directory.path}/believer.db`,
    remoteUrl: () => null,
    connect: connectNode,
  });

describe(createPrayerTimesRepository, () => {
  beforeEach(async () => {
    directory = temporaryDirectory();
    database = await launch();
  });

  afterEach(async () => {
    await database.close();
    directory.remove();
  });

  it("hides Imsak, Asr, Sunset and Isha for a new Believer", async () => {
    await expect(
      createPrayerTimesRepository(database.db).hiddenPrayerTimes()
    ).resolves.toStrictEqual(["imsak", "asr", "sunset", "isha"]);
  });

  it("keeps shown and hidden Prayer Times across a relaunch", async () => {
    const prayerTimes = createPrayerTimesRepository(database.db);
    await prayerTimes.setVisible("asr", true);
    await expect(prayerTimes.setVisible("fajr", false)).resolves.toStrictEqual([
      "imsak",
      "fajr",
      "sunset",
      "isha",
    ]);

    await database.close();
    database = await launch();

    await expect(
      createPrayerTimesRepository(database.db).hiddenPrayerTimes()
    ).resolves.toStrictEqual(["imsak", "fajr", "sunset", "isha"]);
  });

  it("can show every Prayer Time", async () => {
    const prayerTimes = createPrayerTimesRepository(database.db);
    for (const name of ["imsak", "asr", "sunset", "isha"] as const) {
      // oxlint-disable-next-line no-await-in-loop -- each change reads the last
      await prayerTimes.setVisible(name, true);
    }

    await expect(prayerTimes.hiddenPrayerTimes()).resolves.toStrictEqual([]);
  });

  it("ignores names it does not know (written by a newer app)", async () => {
    await createPrayerTimesRepository(database.db).setVisible("asr", true);
    await database.db.run(
      sql`UPDATE prayer_times_settings SET hidden_prayer_times = '["isha","duha"]'`
    );

    await expect(
      createPrayerTimesRepository(database.db).hiddenPrayerTimes()
    ).resolves.toStrictEqual(["isha"]);
  });
});
