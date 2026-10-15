import { sql } from "drizzle-orm";
import { Temporal } from "temporal-polyfill";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { connectNode, temporaryDirectory } from "../shared/testing";
import type { TemporaryDirectory } from "../shared/testing";
import { openUserDatabase } from "../shared/user-database";
import type { UserDatabase } from "../shared/user-database";
import { readDhikrSessionsInsightsSource } from "./insights-source";

const BAGHDAD = "Asia/Baghdad";
const date = (iso: string) => Temporal.PlainDate.from(iso);
// 2026-10-14 22:30 UTC is already 2026-10-15 01:30 in Baghdad.
const LATE_EVENING_UTC = Date.UTC(2026, 9, 14, 22, 30);
const NOON_UTC = Date.UTC(2026, 9, 14, 12);

let directory: TemporaryDirectory;
let database: UserDatabase;

describe(readDhikrSessionsInsightsSource, () => {
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
      readDhikrSessionsInsightsSource(database.db, BAGHDAD)
    ).resolves.toStrictEqual([]);
  });

  it("reads Dhikr Sessions on their local date, naming each Tasbih", async () => {
    await database.db.run(
      sql`INSERT INTO tasbih (id, kind, name, count, step) VALUES
          ('morning', 'open', 'Morning', 0, 0)`
    );
    await database.db.run(
      sql`INSERT INTO dhikr_sessions (id, tasbih_id, count, completed_at) VALUES
          ('a', 'tasbih-al-zahra', 100, ${NOON_UTC}),
          ('b', 'morning', 33, ${LATE_EVENING_UTC}),
          ('c', 'deleted', 7, ${LATE_EVENING_UTC}),
          ('d', 'morning', 0, ${LATE_EVENING_UTC})`
    );

    await expect(
      readDhikrSessionsInsightsSource(database.db, BAGHDAD)
    ).resolves.toStrictEqual([
      {
        tasbihId: "tasbih-al-zahra",
        tasbih: { kind: "tasbih-al-zahra" },
        count: 100,
        date: date("2026-10-14"),
      },
      {
        tasbihId: "morning",
        tasbih: { kind: "open", name: "Morning" },
        count: 33,
        date: date("2026-10-15"),
      },
      {
        tasbihId: "deleted",
        tasbih: { kind: "removed" },
        count: 7,
        date: date("2026-10-15"),
      },
    ]);
  });
});
