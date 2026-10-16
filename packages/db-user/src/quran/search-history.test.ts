import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { openUserDatabase } from "../shared";
import type { UserDatabase } from "../shared";
import { connectNode, temporaryDirectory } from "../shared/testing";
import type { TemporaryDirectory } from "../shared/testing";
import { createQuranSearchHistoryRepository } from "./search-history";

let directory: TemporaryDirectory;
let database: UserDatabase;

const launch = (): Promise<UserDatabase> =>
  openUserDatabase({
    path: `${directory.path}/believer.db`,
    remoteUrl: () => null,
    connect: connectNode,
  });

/** A clock that moves one second per reading. */
const ticking = () => {
  let second = 0;
  return () => new Date(Date.UTC(2026, 0, 1, 0, 0, (second += 1)));
};

describe(createQuranSearchHistoryRepository, () => {
  beforeEach(async () => {
    directory = temporaryDirectory();
    database = await launch();
  });

  afterEach(async () => {
    await database.close();
    directory.remove();
  });

  it("starts empty", async () => {
    const history = createQuranSearchHistoryRepository(database.db);
    await expect(history.list()).resolves.toStrictEqual([]);
  });

  it("keeps the last ten searches, latest first", async () => {
    const history = createQuranSearchHistoryRepository(database.db, ticking());
    for (let number = 1; number <= 12; number += 1) {
      // oxlint-disable-next-line no-await-in-loop -- each search follows the last
      await history.record(`1:${number}`);
    }

    const list = await history.list();
    expect(list).toHaveLength(10);
    expect(list[0]).toBe("1:12");
    expect(list.at(-1)).toBe("1:3");
  });

  it("moves a repeated search to the top without duplicating it", async () => {
    const history = createQuranSearchHistoryRepository(database.db, ticking());
    await history.record("2:255");
    await history.record("الكهف");
    await history.record("Baqarah");
    await history.record("baqarah");

    await expect(history.list()).resolves.toStrictEqual([
      "baqarah",
      "الكهف",
      "2:255",
    ]);
  });

  it("clears every search, and stays empty after a relaunch", async () => {
    const history = createQuranSearchHistoryRepository(database.db);
    await history.record("2:255");
    await history.clear();

    await database.close();
    database = await launch();
    await expect(
      createQuranSearchHistoryRepository(database.db).list()
    ).resolves.toStrictEqual([]);
  });
});
