import { InvalidKhushuError } from "@alrisali/domain/khushu";
import { sql } from "drizzle-orm";
import { Temporal } from "temporal-polyfill";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { openUserDatabase } from "../shared";
import type { UserDatabase } from "../shared";
import { connectNode, temporaryDirectory } from "../shared/testing";
import type { TemporaryDirectory } from "../shared/testing";
import { createKhushuRepository } from "./repository";

const TODAY = Temporal.PlainDate.from("2026-10-15");
const YESTERDAY = Temporal.PlainDate.from("2026-10-14");
const RATED_AT = new Date("2026-10-15T12:00:00.000Z");

let directory: TemporaryDirectory;
let database: UserDatabase;

const launch = (): Promise<UserDatabase> =>
  openUserDatabase({
    path: `${directory.path}/believer.db`,
    remoteUrl: () => null,
    connect: connectNode,
  });

const rating = {
  date: TODAY,
  salah: "maghrib",
  level: 8,
  distractions: [],
  customDistraction: null,
  today: TODAY,
  at: RATED_AT,
} as const;

describe(createKhushuRepository, () => {
  beforeEach(async () => {
    directory = temporaryDirectory();
    database = await launch();
  });

  afterEach(async () => {
    await database.close();
    directory.remove();
  });

  it("has no Khushu before the first rating", async () => {
    await expect(
      createKhushuRepository(database.db).entries()
    ).resolves.toStrictEqual([]);
  });

  it("keeps Khushu per Salah per date across a relaunch", async () => {
    const khushu = createKhushuRepository(database.db);
    await khushu.save({
      ...rating,
      salah: "isha",
      level: 4,
      distractions: ["fatigue", "phoneNotifications"],
      customDistraction: "Guests arriving",
    });
    await khushu.save({ ...rating, salah: "fajr", level: 9 });
    await khushu.save({ ...rating, date: YESTERDAY, salah: "isha", level: 2 });

    await database.close();
    database = await launch();

    await expect(
      createKhushuRepository(database.db).entries()
    ).resolves.toStrictEqual([
      {
        date: YESTERDAY,
        salah: "isha",
        level: 2,
        distractions: [],
        customDistraction: null,
      },
      {
        date: TODAY,
        salah: "fajr",
        level: 9,
        distractions: [],
        customDistraction: null,
      },
      {
        date: TODAY,
        salah: "isha",
        level: 4,
        distractions: ["phoneNotifications", "fatigue"],
        customDistraction: "Guests arriving",
      },
    ]);
  });

  it("replaces the Salah's Khushu when the Believer edits it", async () => {
    const khushu = createKhushuRepository(database.db);
    await khushu.save({
      ...rating,
      distractions: ["mindWandering"],
      customDistraction: "Traffic noise",
    });

    await expect(
      khushu.save({ ...rating, level: 3, distractions: ["laziness"] })
    ).resolves.toStrictEqual({
      date: TODAY,
      salah: "maghrib",
      level: 3,
      distractions: ["laziness"],
      customDistraction: null,
    });
    await expect(khushu.entries()).resolves.toStrictEqual([
      {
        date: TODAY,
        salah: "maghrib",
        level: 3,
        distractions: ["laziness"],
        customDistraction: null,
      },
    ]);
  });

  it("removes one Salah's Khushu and leaves the others", async () => {
    const khushu = createKhushuRepository(database.db);
    await khushu.save(rating);
    await khushu.save({ ...rating, salah: "isha" });

    await khushu.remove({ date: TODAY, salah: "maghrib" });

    await expect(khushu.entries()).resolves.toStrictEqual([
      {
        date: TODAY,
        salah: "isha",
        level: 8,
        distractions: [],
        customDistraction: null,
      },
    ]);
  });

  it("refuses a future date and saves nothing", async () => {
    const khushu = createKhushuRepository(database.db);

    await expect(
      khushu.save({ ...rating, date: TODAY.add({ days: 1 }) })
    ).rejects.toThrow(InvalidKhushuError);
    await expect(khushu.entries()).resolves.toStrictEqual([]);
  });

  it("skips Salah names and Distractions this app does not know", async () => {
    await database.db.run(
      sql`INSERT INTO khushu (id, date, salah, level, distractions, rated_at)
          VALUES ('2026-10-15:witr', '2026-10-15', 'witr', 5, '[]', 0),
                 ('2026-10-15:asr', '2026-10-15', 'asr', 5, '["fatigue","hunger"]', 0)`
    );

    await expect(
      createKhushuRepository(database.db).entries()
    ).resolves.toStrictEqual([
      {
        date: TODAY,
        salah: "asr",
        level: 5,
        distractions: ["fatigue"],
        customDistraction: null,
      },
    ]);
  });
});
