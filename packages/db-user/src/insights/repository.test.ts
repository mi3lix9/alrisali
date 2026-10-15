import { sql } from "drizzle-orm";
import { Temporal } from "temporal-polyfill";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { connectNode, temporaryDirectory } from "../shared/testing";
import type { TemporaryDirectory } from "../shared/testing";
import { openUserDatabase } from "../shared/user-database";
import type { UserDatabase } from "../shared/user-database";
import { createInsightsRepository } from "./repository";

// Insights read the tables other features write. These rows are written as
// those features store them, so a change to their columns fails here.

const BAGHDAD = "Asia/Baghdad";
const date = (iso: string) => Temporal.PlainDate.from(iso);
// 2026-10-14 22:30 UTC is already 2026-10-15 01:30 in Baghdad.
const LATE_EVENING_UTC = Date.UTC(2026, 9, 14, 22, 30);
const NOON_UTC = Date.UTC(2026, 9, 14, 12);

let directory: TemporaryDirectory;
let database: UserDatabase;

describe(createInsightsRepository, () => {
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
      createInsightsRepository(database.db).sources(BAGHDAD)
    ).resolves.toStrictEqual({
      prayerLogs: [],
      khushu: [],
      habits: [],
      habitCompletions: [],
      dhikrSessions: [],
      moodCheckIns: [],
    });
  });

  it("reads the Prayer Log grouped by date, in the day's order", async () => {
    await database.db.run(
      sql`INSERT INTO prayer_logs (id, date, salah, logged_at) VALUES
          ('2026-10-15:isha', '2026-10-15', 'isha', ${NOON_UTC}),
          ('2026-10-14:asr', '2026-10-14', 'asr', ${NOON_UTC}),
          ('2026-10-15:fajr', '2026-10-15', 'fajr', ${NOON_UTC}),
          ('2026-10-15:duha', '2026-10-15', 'duha', ${NOON_UTC})`
    );

    const { prayerLogs } = await createInsightsRepository(database.db).sources(
      BAGHDAD
    );

    expect(prayerLogs).toStrictEqual([
      { date: date("2026-10-14"), performed: ["asr"] },
      { date: date("2026-10-15"), performed: ["fajr", "isha"] },
    ]);
  });

  it("reads Khushu ratings with their Distractions", async () => {
    await database.db.run(
      sql`INSERT INTO khushu (id, date, salah, level, distractions, custom_distraction, rated_at) VALUES
          ('2026-10-15:fajr', '2026-10-15', 'fajr', 8, '["fatigue","mindWandering"]', NULL, ${NOON_UTC}),
          ('2026-10-15:asr', '2026-10-15', 'asr', 4, 'not json', 'Hunger', ${NOON_UTC}),
          ('2026-10-15:duha', '2026-10-15', 'duha', 9, '[]', NULL, ${NOON_UTC}),
          ('2026-10-15:isha', '2026-10-15', 'isha', 11, '[]', NULL, ${NOON_UTC})`
    );

    const { khushu } = await createInsightsRepository(database.db).sources(
      BAGHDAD
    );

    expect(khushu).toStrictEqual([
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

  it("reads Habits, created on their local date, and their completions", async () => {
    await database.db.run(
      sql`INSERT INTO habits (id, name, preset, schedule, reminder_at, archived_at, created_at) VALUES
          ('default:drink-water', NULL, 'drink-water', '{"kind":"daily"}', NULL, NULL, ${LATE_EVENING_UTC}),
          ('own', 'Charity', NULL, '{"kind":"weekdays","weekdays":[5,1]}', 540, ${NOON_UTC}, ${NOON_UTC}),
          ('newer', 'From a newer app', NULL, '{"kind":"monthly"}', NULL, NULL, ${NOON_UTC})`
    );
    await database.db.run(
      sql`INSERT INTO habit_completions (id, habit_id, date, completed_at) VALUES
          ('own:2026-10-12', 'own', '2026-10-12', ${NOON_UTC})`
    );

    const { habits, habitCompletions } = await createInsightsRepository(
      database.db
    ).sources(BAGHDAD);

    expect(habits).toStrictEqual([
      {
        id: "own",
        name: "Charity",
        preset: null,
        schedule: { kind: "weekdays", weekdays: [1, 5] },
        archived: true,
        createdOn: date("2026-10-14"),
      },
      {
        id: "default:drink-water",
        name: null,
        preset: "drink-water",
        schedule: { kind: "daily" },
        archived: false,
        createdOn: date("2026-10-15"),
      },
    ]);
    expect(habitCompletions).toStrictEqual([
      { habitId: "own", date: date("2026-10-12") },
    ]);
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
          ('c', 'deleted', 7, ${LATE_EVENING_UTC})`
    );

    const { dhikrSessions } = await createInsightsRepository(
      database.db
    ).sources(BAGHDAD);

    expect(dhikrSessions).toStrictEqual([
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

  it("reads Mood Check-ins on their local date", async () => {
    await database.db.run(
      sql`INSERT INTO mood_check_ins (id, mood, remedy_id, checked_in_at) VALUES
          ('0b6f1c1e-3a43-4c38-9a9e-6f0c3c2b8a10', 'calm', 'calm-hearts-at-rest', ${NOON_UTC}),
          ('5d1f6a2b-7c8e-4f90-8a1b-2c3d4e5f6a7b', 'sad', 'sad-hardship-ease', ${LATE_EVENING_UTC})`
    );

    const { moodCheckIns } = await createInsightsRepository(
      database.db
    ).sources(BAGHDAD);

    expect(moodCheckIns).toStrictEqual([
      { mood: "calm", date: date("2026-10-14") },
      { mood: "sad", date: date("2026-10-15") },
    ]);
  });
});
