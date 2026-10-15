import { sql } from "drizzle-orm";
import { Temporal } from "temporal-polyfill";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { connectNode, temporaryDirectory } from "../shared/testing";
import type { TemporaryDirectory } from "../shared/testing";
import { openUserDatabase } from "../shared/user-database";
import type { UserDatabase } from "../shared/user-database";
import { readMoodCheckInsInsightsSource } from "./insights-source";

const BAGHDAD = "Asia/Baghdad";
const date = (iso: string) => Temporal.PlainDate.from(iso);
// 2026-10-14 22:30 UTC is already 2026-10-15 01:30 in Baghdad.
const LATE_EVENING_UTC = Date.UTC(2026, 9, 14, 22, 30);
const NOON_UTC = Date.UTC(2026, 9, 14, 12);

let directory: TemporaryDirectory;
let database: UserDatabase;

describe(readMoodCheckInsInsightsSource, () => {
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
      readMoodCheckInsInsightsSource(database.db, BAGHDAD)
    ).resolves.toStrictEqual([]);
  });

  it("reads Mood Check-ins on their local date", async () => {
    await database.db.run(
      sql`INSERT INTO mood_check_ins (id, mood, remedy_id, checked_in_at) VALUES
          ('0b6f1c1e-3a43-4c38-9a9e-6f0c3c2b8a10', 'calm', 'calm-hearts-at-rest', ${NOON_UTC}),
          ('5d1f6a2b-7c8e-4f90-8a1b-2c3d4e5f6a7b', 'sad', 'sad-hardship-ease', ${LATE_EVENING_UTC})`
    );

    await expect(
      readMoodCheckInsInsightsSource(database.db, BAGHDAD)
    ).resolves.toStrictEqual([
      { mood: "calm", date: date("2026-10-14") },
      { mood: "sad", date: date("2026-10-15") },
    ]);
  });
});
