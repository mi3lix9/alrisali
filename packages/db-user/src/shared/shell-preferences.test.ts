import { sql } from "drizzle-orm";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { createShellPreferencesRepository } from "./shell-preferences";
import { connectNode, temporaryDirectory } from "./testing";
import type { TemporaryDirectory } from "./testing";
import { openUserDatabase } from "./user-database";
import type { UserDatabase } from "./user-database";

const NONE_CHOSEN = {
  language: null,
  theme: null,
  textSize: null,
  hiddenTabs: null,
  digits: null,
};

let directory: TemporaryDirectory;
let database: UserDatabase;

const launch = (): Promise<UserDatabase> =>
  openUserDatabase({
    path: `${directory.path}/believer.db`,
    remoteUrl: () => null,
    connect: connectNode,
  });

/** Closes the database and opens it again, as an app relaunch does. */
const relaunch = async (): Promise<void> => {
  await database.close();
  database = await launch();
};

describe(createShellPreferencesRepository, () => {
  beforeEach(async () => {
    directory = temporaryDirectory();
    database = await launch();
  });

  afterEach(async () => {
    await database.close();
    directory.remove();
  });

  it("has nothing chosen in a new database", async () => {
    await expect(
      createShellPreferencesRepository(database.db).get()
    ).resolves.toStrictEqual(NONE_CHOSEN);
  });

  it("keeps every preference across a relaunch", async () => {
    await createShellPreferencesRepository(database.db).update({
      language: "en",
      theme: "dark",
      textSize: "larger",
      hiddenTabs: ["library", "tasbih"],
      digits: "latin",
    });

    await relaunch();

    await expect(
      createShellPreferencesRepository(database.db).get()
    ).resolves.toStrictEqual({
      language: "en",
      theme: "dark",
      textSize: "larger",
      hiddenTabs: ["library", "tasbih"],
      digits: "latin",
    });
  });

  it("changes one preference without touching the others", async () => {
    const preferences = createShellPreferencesRepository(database.db);
    await preferences.update({ theme: "light" });
    await preferences.update({ hiddenTabs: [] });
    await preferences.update({ digits: "arabic-indic" });

    await expect(
      preferences.update({ textSize: "small" })
    ).resolves.toStrictEqual({
      language: null,
      theme: "light",
      textSize: "small",
      hiddenTabs: [],
      digits: "arabic-indic",
    });
    await expect(preferences.get()).resolves.toStrictEqual({
      language: null,
      theme: "light",
      textSize: "small",
      hiddenTabs: [],
      digits: "arabic-indic",
    });
  });

  it("rejects a value it does not know and keeps the saved one", async () => {
    const preferences = createShellPreferencesRepository(database.db);
    await preferences.update({ theme: "dark" });

    await expect(
      preferences.update({ theme: "sepia" as never })
    ).rejects.toThrow("theme");
    await expect(preferences.get()).resolves.toMatchObject({ theme: "dark" });
  });

  it("reads values it does not know (written by a newer app) as not chosen", async () => {
    const preferences = createShellPreferencesRepository(database.db);
    await preferences.update({
      language: "ar",
      hiddenTabs: ["prayer"],
      digits: "latin",
    });
    await database.db.run(
      sql`UPDATE shell_preferences SET language = 'fr', theme = 'sepia', text_size = 'huge', hidden_tabs = 'not json', digits = 'roman'`
    );

    await expect(preferences.get()).resolves.toStrictEqual(NONE_CHOSEN);
  });

  it("drops tabs it does not know, and Home, from the hidden tabs", async () => {
    const preferences = createShellPreferencesRepository(database.db);
    await preferences.update({ language: "ar" });
    await database.db.run(
      sql`UPDATE shell_preferences SET hidden_tabs = '["future", "home", "worship"]'`
    );

    await expect(preferences.get()).resolves.toMatchObject({
      hiddenTabs: ["worship"],
    });
  });
});
