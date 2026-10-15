import { sql } from "drizzle-orm";
import { Temporal } from "temporal-polyfill";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { connectNode, temporaryDirectory } from "../shared/testing";
import type { TemporaryDirectory } from "../shared/testing";
import { openUserDatabase } from "../shared/user-database";
import type { UserDatabase } from "../shared/user-database";
import { readPrayerLogInsightsSource } from "./insights-source";

const BAGHDAD = "Asia/Baghdad";
const date = (iso: string) => Temporal.PlainDate.from(iso);
const NOON_UTC = Date.UTC(2026, 9, 14, 12);

let directory: TemporaryDirectory;
let database: UserDatabase;

describe(readPrayerLogInsightsSource, () => {
  beforeEach(async () => {
    directory = temporaryDirectory();
    // A Guest's database: no sync server, so this is fully offline.
    database = await openUserDatabase({
      path: `${directory.path}/believer.db`,
      remoteUrl: () => null,
      connect: connectNode,
    });
  });

  afterEach(async () => {
    await database.close();
    directory.remove();
  });

  it("reads nothing from a new Guest's database", async () => {
    await expect(
      readPrayerLogInsightsSource(database.db, BAGHDAD)
    ).resolves.toStrictEqual([]);
  });

  it("reads the Prayer Log grouped by date, in the day's order", async () => {
    await database.db.run(
      sql`INSERT INTO prayer_logs (id, date, salah, logged_at) VALUES
          ('2026-10-15:isha', '2026-10-15', 'isha', ${NOON_UTC}),
          ('2026-10-14:asr', '2026-10-14', 'asr', ${NOON_UTC}),
          ('2026-10-15:fajr', '2026-10-15', 'fajr', ${NOON_UTC}),
          ('2026-10-15:duha', '2026-10-15', 'duha', ${NOON_UTC})`
    );

    await expect(
      readPrayerLogInsightsSource(database.db, BAGHDAD)
    ).resolves.toStrictEqual([
      { date: date("2026-10-14"), performed: ["asr"] },
      { date: date("2026-10-15"), performed: ["fajr", "isha"] },
    ]);
  });
});
