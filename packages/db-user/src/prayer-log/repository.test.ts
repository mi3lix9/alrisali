import { FutureDateError } from "@alrisali/domain/prayer-log";
import { sql } from "drizzle-orm";
import { Temporal } from "temporal-polyfill";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { openUserDatabase } from "../shared";
import type { UserDatabase } from "../shared";
import { connectNode, temporaryDirectory } from "../shared/testing";
import type { TemporaryDirectory } from "../shared/testing";
import { createPrayerLogRepository } from "./repository";

const TODAY = Temporal.PlainDate.from("2026-10-15");
const YESTERDAY = Temporal.PlainDate.from("2026-10-14");
const LOGGED_AT = new Date("2026-10-15T12:00:00.000Z");

let directory: TemporaryDirectory;
let database: UserDatabase;

const launch = (): Promise<UserDatabase> =>
  openUserDatabase({
    path: `${directory.path}/believer.db`,
    remoteUrl: () => null,
    connect: connectNode,
  });

const tick = { performed: true, today: TODAY, at: LOGGED_AT } as const;

describe(createPrayerLogRepository, () => {
  beforeEach(async () => {
    directory = temporaryDirectory();
    database = await launch();
  });

  afterEach(async () => {
    await database.close();
    directory.remove();
  });

  it("has no Prayer Logs before the first tick", async () => {
    await expect(
      createPrayerLogRepository(database.db).logs()
    ).resolves.toStrictEqual([]);
  });

  it("keeps ticked Salah across a relaunch, each date in the day's order", async () => {
    const prayerLogs = createPrayerLogRepository(database.db);
    await prayerLogs.setPerformed({ ...tick, date: TODAY, salah: "maghrib" });
    await prayerLogs.setPerformed({ ...tick, date: TODAY, salah: "fajr" });
    await prayerLogs.setPerformed({ ...tick, date: YESTERDAY, salah: "isha" });

    await database.close();
    database = await launch();

    await expect(
      createPrayerLogRepository(database.db).logs()
    ).resolves.toStrictEqual([
      { date: YESTERDAY, performed: ["isha"] },
      { date: TODAY, performed: ["fajr", "maghrib"] },
    ]);
  });

  it("returns the date's Prayer Log after each change", async () => {
    const prayerLogs = createPrayerLogRepository(database.db);
    await prayerLogs.setPerformed({ ...tick, date: TODAY, salah: "dhuhr" });

    await expect(
      prayerLogs.setPerformed({ ...tick, date: TODAY, salah: "fajr" })
    ).resolves.toStrictEqual({ date: TODAY, performed: ["fajr", "dhuhr"] });
  });

  it("un-ticks a Salah, and drops a date left with none", async () => {
    const prayerLogs = createPrayerLogRepository(database.db);
    await prayerLogs.setPerformed({ ...tick, date: TODAY, salah: "fajr" });
    await prayerLogs.setPerformed({ ...tick, date: YESTERDAY, salah: "asr" });

    await expect(
      prayerLogs.setPerformed({
        ...tick,
        performed: false,
        date: TODAY,
        salah: "fajr",
      })
    ).resolves.toStrictEqual({ date: TODAY, performed: [] });
    await expect(prayerLogs.logs()).resolves.toStrictEqual([
      { date: YESTERDAY, performed: ["asr"] },
    ]);
  });

  it("logs a Salah once however often it is ticked", async () => {
    const prayerLogs = createPrayerLogRepository(database.db);
    await prayerLogs.setPerformed({ ...tick, date: TODAY, salah: "fajr" });
    await prayerLogs.setPerformed({ ...tick, date: TODAY, salah: "fajr" });

    await expect(prayerLogs.logs()).resolves.toStrictEqual([
      { date: TODAY, performed: ["fajr"] },
    ]);
  });

  it("refuses a future date, and saves nothing", async () => {
    const prayerLogs = createPrayerLogRepository(database.db);

    await expect(
      prayerLogs.setPerformed({
        ...tick,
        date: TODAY.add({ days: 1 }),
        salah: "fajr",
      })
    ).rejects.toThrow(FutureDateError);
    await expect(prayerLogs.logs()).resolves.toStrictEqual([]);
  });

  it("skips a Salah name this app does not know (written by a newer app)", async () => {
    const prayerLogs = createPrayerLogRepository(database.db);
    await prayerLogs.setPerformed({ ...tick, date: TODAY, salah: "fajr" });
    await database.db.run(
      sql`INSERT INTO prayer_logs (id, date, salah, logged_at)
          VALUES ('2026-10-15:duha', '2026-10-15', 'duha', ${LOGGED_AT.getTime()})`
    );

    await expect(prayerLogs.logs()).resolves.toStrictEqual([
      { date: TODAY, performed: ["fajr"] },
    ]);
  });
});
