import type { InsightsSources } from "@alrisali/domain/shared";
import { Temporal } from "temporal-polyfill";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import type { InsightsSourceReaders } from "../shared";
import { connectNode, temporaryDirectory } from "../shared/testing";
import type { TemporaryDirectory } from "../shared/testing";
import { openUserDatabase } from "../shared/user-database";
import type { UserDatabase, UserDb } from "../shared/user-database";
import { createInsightsRepository } from "./repository";

// Each feature's own reader is tested next to it (`<feature>/insights-source`);
// this checks Insights gather every source from the readers they are given.

const BAGHDAD = "Asia/Baghdad";
const date = (iso: string) => Temporal.PlainDate.from(iso);

const SOURCES: InsightsSources = {
  prayerLogs: [{ date: date("2026-10-15"), performed: ["fajr"] }],
  khushu: [
    {
      date: date("2026-10-15"),
      salah: "fajr",
      level: 8,
      distractions: ["fatigue"],
      customDistraction: null,
    },
  ],
  habits: [
    {
      id: "own",
      name: "Charity",
      preset: null,
      schedule: { kind: "daily" },
      archived: false,
      createdOn: date("2026-10-14"),
    },
  ],
  habitCompletions: [{ habitId: "own", date: date("2026-10-15") }],
  dhikrSessions: [
    {
      tasbihId: "tasbih-al-zahra",
      tasbih: { kind: "tasbih-al-zahra" },
      count: 100,
      date: date("2026-10-15"),
    },
  ],
  moodCheckIns: [{ mood: "calm", date: date("2026-10-15") }],
  khatmahs: [],
};

let directory: TemporaryDirectory;
let database: UserDatabase;

describe(createInsightsRepository, () => {
  beforeEach(async () => {
    directory = temporaryDirectory();
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

  it("reads every source through its feature's reader, in the Believer's time zone", async () => {
    const calls: [keyof InsightsSources, UserDb, string][] = [];
    const reader =
      <Source extends keyof InsightsSources>(source: Source) =>
      (db: UserDb, timeZone: string) => {
        calls.push([source, db, timeZone]);
        return Promise.resolve(SOURCES[source]);
      };
    const readers: InsightsSourceReaders = {
      prayerLogs: reader("prayerLogs"),
      khushu: reader("khushu"),
      habits: reader("habits"),
      habitCompletions: reader("habitCompletions"),
      dhikrSessions: reader("dhikrSessions"),
      moodCheckIns: reader("moodCheckIns"),
      khatmahs: reader("khatmahs"),
    };

    await expect(
      createInsightsRepository(database.db, readers).sources(BAGHDAD)
    ).resolves.toStrictEqual(SOURCES);
    expect(calls).toStrictEqual(
      Object.keys(SOURCES).map((source) => [source, database.db, BAGHDAD])
    );
  });
});
