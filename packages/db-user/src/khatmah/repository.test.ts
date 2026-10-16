import { khatmahStatus } from "@alrisali/domain/khatmah";
import { sql } from "drizzle-orm";
import { Temporal } from "temporal-polyfill";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { openUserDatabase } from "../shared";
import type { UserDatabase } from "../shared";
import { connectNode, temporaryDirectory } from "../shared/testing";
import type { TemporaryDirectory } from "../shared/testing";
import { createKhatmahRepository } from "./repository";

const START = Temporal.PlainDate.from("2026-10-15");
const AT = new Date("2026-10-15T09:00:00.000Z");
const ID = "1b9d6bcd-bbfd-4b2d-9b5d-ab8dfbbd4bed";
const OTHER_ID = "6ec0bd7f-11c0-43da-975e-2a8ad9ebae0b";

let directory: TemporaryDirectory;
let database: UserDatabase;

const launch = (): Promise<UserDatabase> =>
  openUserDatabase({
    path: `${directory.path}/believer.db`,
    remoteUrl: () => null,
    connect: connectNode,
  });

describe(createKhatmahRepository, () => {
  beforeEach(async () => {
    directory = temporaryDirectory();
    database = await launch();
  });

  afterEach(async () => {
    await database.close();
    directory.remove();
  });

  it("saves a Khatmah and lists it with its plan, start and reminder", async () => {
    const repository = createKhatmahRepository(database.db);
    await repository.create(
      ID,
      { plan: { kind: "even", days: 45 }, startDate: START, reminderAt: 300 },
      AT
    );

    await expect(repository.list()).resolves.toStrictEqual([
      {
        id: ID,
        plan: { kind: "even", days: 45 },
        startDate: START,
        reminderAt: 300,
        createdAt: AT.getTime(),
      },
    ]);
  });

  it("refuses a plan outside 3 to 240 days and a bad reminder time, saving nothing", async () => {
    const repository = createKhatmahRepository(database.db);
    await expect(
      repository.create(
        ID,
        { plan: { kind: "even", days: 2 }, startDate: START, reminderAt: null },
        AT
      )
    ).rejects.toThrow(/./u);
    await expect(
      repository.create(
        ID,
        { plan: { kind: "suggested" }, startDate: START, reminderAt: 1440 },
        AT
      )
    ).rejects.toThrow(/./u);
    await expect(repository.list()).resolves.toStrictEqual([]);
  });

  it("changes and clears the reminder", async () => {
    const repository = createKhatmahRepository(database.db);
    await repository.create(
      ID,
      { plan: { kind: "suggested" }, startDate: START, reminderAt: null },
      AT
    );
    await repository.setReminder(ID, 360);
    const withReminder = await repository.list();
    expect(withReminder[0]?.reminderAt).toBe(360);
    await repository.setReminder(ID, null);
    const without = await repository.list();
    expect(without[0]?.reminderAt).toBeNull();
  });

  it("records a session once and takes it back", async () => {
    const repository = createKhatmahRepository(database.db);
    const khatmah = await repository.create(
      ID,
      { plan: { kind: "suggested" }, startDate: START, reminderAt: null },
      AT
    );
    const log = { khatmahId: ID, session: 1, date: START };
    await repository.log(log, AT);
    await repository.log(log, new Date(AT.getTime() + 1000));

    const logs = await repository.logs();
    expect(logs).toStrictEqual([log]);
    expect(khatmahStatus(khatmah, logs, START).done).toBe(1);

    await repository.unlog(ID, 1);
    await expect(repository.logs()).resolves.toStrictEqual([]);
  });

  it("deletes a Khatmah with its logs and leaves the others", async () => {
    const repository = createKhatmahRepository(database.db);
    await Promise.all(
      [ID, OTHER_ID].map(async (id) => {
        await repository.create(
          id,
          { plan: { kind: "suggested" }, startDate: START, reminderAt: null },
          AT
        );
        await repository.log({ khatmahId: id, session: 1, date: START }, AT);
      })
    );

    await repository.remove(ID);

    const khatmahs = await repository.list();
    const logs = await repository.logs();
    expect(khatmahs.map(({ id }) => id)).toStrictEqual([OTHER_ID]);
    expect(logs.map(({ khatmahId }) => khatmahId)).toStrictEqual([OTHER_ID]);
  });

  it("leaves out a Khatmah whose plan this app cannot read", async () => {
    const repository = createKhatmahRepository(database.db);
    await database.db.run(
      sql`INSERT INTO khatmahs (id, plan, start_date, reminder_at, created_at)
          VALUES (${ID}, '{"kind":"by-meaning","days":7}', '2026-10-15', NULL, 0)`
    );
    await expect(repository.list()).resolves.toStrictEqual([]);
  });
});
