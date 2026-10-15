import { sql } from "drizzle-orm";
import { Temporal } from "temporal-polyfill";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { connectNode, temporaryDirectory } from "../shared/testing";
import type { TemporaryDirectory } from "../shared/testing";
import { openUserDatabase } from "../shared/user-database";
import type { UserDatabase } from "../shared/user-database";
import { readKhushuInsightsSource } from "./insights-source";

const BAGHDAD = "Asia/Baghdad";
const date = (iso: string) => Temporal.PlainDate.from(iso);
const NOON_UTC = Date.UTC(2026, 9, 14, 12);

let directory: TemporaryDirectory;
let database: UserDatabase;

describe(readKhushuInsightsSource, () => {
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
      readKhushuInsightsSource(database.db, BAGHDAD)
    ).resolves.toStrictEqual([]);
  });

  it("reads Khushu ratings with their Distractions", async () => {
    await database.db.run(
      sql`INSERT INTO khushu (id, date, salah, level, distractions, custom_distraction, rated_at) VALUES
          ('2026-10-15:fajr', '2026-10-15', 'fajr', 8, '["fatigue","mindWandering"]', NULL, ${NOON_UTC}),
          ('2026-10-15:asr', '2026-10-15', 'asr', 4, 'not json', 'Hunger', ${NOON_UTC}),
          ('2026-10-15:duha', '2026-10-15', 'duha', 9, '[]', NULL, ${NOON_UTC}),
          ('2026-10-15:isha', '2026-10-15', 'isha', 11, '[]', NULL, ${NOON_UTC}),
          ('2026-10-15:maghrib', '2026-10-15', 'maghrib', -1, '[]', NULL, ${NOON_UTC})`
    );

    await expect(
      readKhushuInsightsSource(database.db, BAGHDAD)
    ).resolves.toStrictEqual([
      {
        date: date("2026-10-15"),
        salah: "fajr",
        level: 8,
        distractions: ["fatigue", "mindWandering"],
        customDistraction: null,
      },
      {
        date: date("2026-10-15"),
        salah: "asr",
        level: 4,
        distractions: [],
        customDistraction: "Hunger",
      },
    ]);
  });
});
