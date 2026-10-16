import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { openUserDatabase } from "../shared";
import type { UserDatabase } from "../shared";
import { connectNode, temporaryDirectory } from "../shared/testing";
import type { TemporaryDirectory } from "../shared/testing";
import { createReadingCompletionsRepository } from "./repository";

const KUMAYL_TODAY = {
  supplicationId: "mafatih-dua-kumayl",
  date: "2026-10-15",
};

let directory: TemporaryDirectory;
let database: UserDatabase;

/** A Guest's database: no cloud URL, so it never syncs. */
const launch = (): Promise<UserDatabase> =>
  openUserDatabase({
    path: `${directory.path}/believer.db`,
    remoteUrl: () => null,
    connect: connectNode,
  });

describe(createReadingCompletionsRepository, () => {
  beforeEach(async () => {
    directory = temporaryDirectory();
    database = await launch();
  });

  afterEach(async () => {
    await database.close();
    directory.remove();
  });

  it("keeps a Guest's Reading Completion across a relaunch", async () => {
    await createReadingCompletionsRepository(database.db).markRead(
      KUMAYL_TODAY
    );

    await database.close();
    database = await launch();

    const completions = createReadingCompletionsRepository(database.db);
    await expect(completions.isRead(KUMAYL_TODAY)).resolves.toBeTruthy();
    await expect(completions.readOn("2026-10-15")).resolves.toStrictEqual([
      "mafatih-dua-kumayl",
    ]);
  });

  it("counts a Supplication read on a day once, however often it is marked", async () => {
    const completions = createReadingCompletionsRepository(database.db);
    await completions.markRead(KUMAYL_TODAY);
    await completions.markRead(KUMAYL_TODAY);
    await completions.markRead({
      supplicationId: "sahifa-1",
      date: "2026-10-15",
    });

    await expect(completions.readOn("2026-10-15")).resolves.toStrictEqual([
      "mafatih-dua-kumayl",
      "sahifa-1",
    ]);
  });

  it("keeps each day apart", async () => {
    const completions = createReadingCompletionsRepository(database.db);
    await completions.markRead(KUMAYL_TODAY);

    await expect(
      completions.isRead({ ...KUMAYL_TODAY, date: "2026-10-16" })
    ).resolves.toBeFalsy();
    await expect(completions.readOn("2026-10-16")).resolves.toStrictEqual([]);
  });

  it("undoes a mark made by mistake", async () => {
    const completions = createReadingCompletionsRepository(database.db);
    await completions.markRead(KUMAYL_TODAY);

    await completions.unmarkRead(KUMAYL_TODAY);

    await expect(completions.isRead(KUMAYL_TODAY)).resolves.toBeFalsy();
  });

  it("rejects a day that is not on the calendar", async () => {
    const completions = createReadingCompletionsRepository(database.db);

    await expect(
      completions.markRead({ ...KUMAYL_TODAY, date: "2026-13-01" })
    ).rejects.toThrow("date");
    await expect(completions.readOn("2026-13-01")).rejects.toThrow("date");
  });
});
