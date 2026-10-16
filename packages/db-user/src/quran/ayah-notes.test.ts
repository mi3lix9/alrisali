import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { openUserDatabase } from "../shared";
import type { UserDatabase } from "../shared";
import { connectNode, temporaryDirectory } from "../shared/testing";
import type { TemporaryDirectory } from "../shared/testing";
import { createQuranAyahNotesRepository } from "./ayah-notes";

let directory: TemporaryDirectory;
let database: UserDatabase;

const launch = (): Promise<UserDatabase> =>
  openUserDatabase({
    path: `${directory.path}/believer.db`,
    remoteUrl: () => null,
    connect: connectNode,
  });

describe(createQuranAyahNotesRepository, () => {
  beforeEach(async () => {
    directory = temporaryDirectory();
    database = await launch();
  });

  afterEach(async () => {
    await database.close();
    directory.remove();
  });

  it("lists no notes before one is written", async () => {
    await expect(
      createQuranAyahNotesRepository(database.db).list()
    ).resolves.toStrictEqual([]);
  });

  it("keeps one note per ayah: writing again replaces it", async () => {
    const notes = createQuranAyahNotesRepository(database.db);
    await notes.write("2:255", "first");
    await notes.write("2:255", "second");

    await expect(notes.list()).resolves.toMatchObject([
      { ayah: "2:255", text: "second" },
    ]);
  });

  it("lists notes in mushaf order and keeps them across a relaunch", async () => {
    const notes = createQuranAyahNotesRepository(database.db);
    await notes.write("112:1", "b");
    await notes.write("1:1", "a");

    await database.close();
    database = await launch();

    const relaunched = await createQuranAyahNotesRepository(database.db).list();
    expect(relaunched.map((note) => note.ayah)).toStrictEqual(["1:1", "112:1"]);
  });

  it("deletes the note when it is written blank", async () => {
    const notes = createQuranAyahNotesRepository(database.db);
    await notes.write("1:1", "a");
    await notes.write("1:1", "   ");

    await expect(notes.list()).resolves.toStrictEqual([]);
  });

  it("removes a note", async () => {
    const notes = createQuranAyahNotesRepository(database.db);
    await notes.write("1:1", "a");
    await notes.write("1:2", "b");
    await notes.remove("1:1");

    await expect(notes.list()).resolves.toMatchObject([{ ayah: "1:2" }]);
  });

  it("refuses an ayah the mushaf does not have", async () => {
    await expect(
      createQuranAyahNotesRepository(database.db).write("115:1", "x")
    ).rejects.toThrow("115:1");
  });
});
